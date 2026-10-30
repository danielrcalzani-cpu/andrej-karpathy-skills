import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Flame, GripVertical, Info, Route as RouteIcon, Save } from 'lucide-react';
import { addDays, isFinal, itemVolumes, longDate, periodLabel, periodOrder, shortLocation } from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { post, put } from '../../api.ts';
import { invalidateAll, useResource, useSession } from '../../lib.tsx';
import { Badge, Button, EmptyState, ErrorState, ProgressBar, Skeleton, StatusBadge, cx, useToast } from '../../components/ui.tsx';
import { useAction, useDrivers } from '../../components/actions.tsx';
import { usePanel } from '../../components/DeliveryCard.tsx';
import { PageHeader } from './AdminApp.tsx';

const timeKey = (d: Delivery) => `${periodOrder(d.delivery_period)}-${d.scheduled_start_time ?? '99:99'}`;

/** Avisos quando a ordem manual contraria janelas de horário confirmadas. */
function orderWarnings(stops: Delivery[]): string[] {
  const out: string[] = [];
  let maxKey = '';
  let maxStop: Delivery | null = null;
  stops.forEach((s, i) => {
    const hasWindow = s.delivery_period && s.delivery_period !== 'a_definir';
    if (!hasWindow) return;
    const key = timeKey(s);
    if (maxStop && key < maxKey)
      out.push(
        `Parada ${i + 1} (${s.customer_name}, ${periodLabel(s.delivery_period)}${s.scheduled_start_time ? ` ${s.scheduled_start_time}` : ''}) está depois de ${maxStop.customer_name} (${periodLabel(maxStop.delivery_period)}${maxStop.scheduled_start_time ? ` ${maxStop.scheduled_start_time}` : ''}).`,
      );
    if (key > maxKey) {
      maxKey = key;
      maxStop = s;
    }
  });
  return out;
}

function RouteColumn({ driverId, driverName, stops: initial, date }: { driverId: number | null; driverName: string; stops: Delivery[]; date: string }) {
  const [stops, setStops] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { openDelivery } = usePanel();
  const drivers = useDrivers(date);
  const { busy, run } = useAction();

  // Atualizações do servidor só substituem a lista se não houver reordenação pendente.
  useEffect(() => {
    if (!dirty) setStops(initial);
  }, [initial, dirty]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= stops.length || from === to) return;
    const next = [...stops];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it!);
    setStops(next);
    setDirty(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      await put('/api/routes', { date, driver_id: driverId, ids: stops.map((s) => s.id) });
      toast(`Rota de ${driverName} salva. O entregador verá esta ordem.`);
      setDirty(false);
      invalidateAll();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Erro ao salvar a rota.', 'error');
    } finally {
      setSaving(false);
    }
  };
  const reassign = (d: Delivery, newDriver: string) =>
    run(() => post(`/api/deliveries/${d.id}/schedule`, { driver_id: newDriver || null, version: d.version, reason: 'Remanejada no planejamento de rotas' }), 'Entrega remanejada.');

  const done = stops.filter((s) => s.status === 'entregue').length;
  const vols = stops.map((s) => s.items.map(itemVolumes));
  const volumeTotal = vols.every((v) => v.every((x) => x != null)) ? vols.flat().reduce<number>((a, b) => a + (b ?? 0), 0) : null;
  const weight = stops.flatMap((s) => s.items).reduce((a, i) => a + (i.weight_kg ?? 0), 0);
  const urgent = stops.filter((s) => s.urgency === 'alta' && !isFinal(s.status)).length;
  const unprepared = stops.filter((s) => s.status === 'aguardando_separacao').length;
  const warnings = orderWarnings(stops.filter((s) => !isFinal(s.status)));
  const next = stops.find((s) => !isFinal(s.status) && s.status !== 'problema');

  return (
    <section className="card" aria-label={`Rota de ${driverName}`}>
      <div className="card-head" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
        <div className="row between">
          <h3 className="h-section">{driverName}</h3>
          <span className="small muted">{stops.length} parada(s)</span>
        </div>
        <ProgressBar value={done} max={stops.length} />
        <div className="row wrap tiny muted" style={{ gap: 10 }}>
          <span>
            {done} de {stops.length} concluídas
          </span>
          {volumeTotal != null && volumeTotal > 0 && <span>{volumeTotal} volumes</span>}
          {weight > 0 && <span>{weight.toLocaleString('pt-BR')} kg</span>}
          {urgent > 0 && (
            <Badge tone="danger" icon={<Flame size={11} />}>
              {urgent} urgente(s)
            </Badge>
          )}
          {unprepared > 0 && <Badge tone="warning">{unprepared} sem material conferido</Badge>}
        </div>
        {next && (
          <div className="small">
            Próxima: <b>{next.customer_name}</b> — {shortLocation(next)}
          </div>
        )}
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {stops.map((s, i) => (
          <li
            key={s.id}
            className={cx('stop', dragId === s.id && 'dragging', overId === s.id && dragId !== s.id && 'drop-target')}
            draggable
            onDragStart={(e) => {
              setDragId(s.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverId(s.id);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = stops.findIndex((x) => x.id === dragId);
              move(from, i);
              setDragId(null);
              setOverId(null);
            }}
          >
            <GripVertical size={16} className="muted desktop-only" aria-hidden />
            <span className={cx('stop-num', s.status === 'entregue' && 'done')} aria-label={`Parada ${i + 1}`}>
              {i + 1}
            </span>
            <div className="grow">
              <button type="button" className="th-sort small strong" style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--text)' }} onClick={() => openDelivery(s.id)}>
                {s.urgency === 'alta' && <Flame size={13} color="#DC2626" aria-label="Urgente" />} {shortLocation(s) || 'Sem endereço'} — {s.customer_name}
              </button>
              <div className="row wrap" style={{ gap: 6, marginTop: 2 }}>
                <span className="tiny muted">
                  {periodLabel(s.delivery_period)}
                  {s.scheduled_start_time ? ` · ${s.scheduled_start_time}${s.scheduled_end_time ? `–${s.scheduled_end_time}` : ''}` : ''}
                </span>
                <StatusBadge status={s.status} />
              </div>
              {!isFinal(s.status) && (
                <select
                  className="select route-select"
                  value={s.driver_id ?? ''}
                  disabled={busy || dirty}
                  title={dirty ? 'Salve a ordem antes de remanejar' : undefined}
                  aria-label={`Entregador de ${s.customer_name}`}
                  onChange={(e) => reassign(s, e.target.value)}
                >
                  <option value="">Sem entregador</option>
                  {drivers.data?.drivers
                    .filter((d) => d.active || d.id === s.driver_id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.day_count})
                      </option>
                    ))}
                </select>
              )}
            </div>
            <div className="stack tight">
              <Button size="sm" iconOnly variant="ghost" aria-label={`Subir ${s.customer_name}`} disabled={i === 0} onClick={() => move(i, i - 1)} icon={<ArrowUp size={15} />} />
              <Button size="sm" iconOnly variant="ghost" aria-label={`Descer ${s.customer_name}`} disabled={i === stops.length - 1} onClick={() => move(i, i + 1)} icon={<ArrowDown size={15} />} />
            </div>
          </li>
        ))}
      </ol>
      {(warnings.length > 0 || dirty) && (
        <div className="card-body stack">
          {warnings.length > 0 && (
            <div className="banner tone-warning small" role="status">
              <AlertTriangle size={16} />
              <div className="stack tight">
                <b>A ordem não respeita horários combinados:</b>
                {warnings.map((w) => (
                  <span key={w}>{w}</span>
                ))}
              </div>
            </div>
          )}
          {dirty && (
            <div className="row">
              <Button variant="primary" icon={<Save size={15} />} loading={saving} onClick={save}>
                Salvar ordem
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setStops(initial);
                  setDirty(false);
                }}
              >
                Desfazer
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function Routes() {
  const { config } = useSession();
  const [date, setDate] = useState(config.today);
  const res = useResource<{ items: Delivery[] }>(`/api/deliveries?from=${date}&to=${date}&include_done=1&limit=500`);
  const items = (res.data?.items ?? []).filter((d) => d.status !== 'cancelada');
  const groups = new Map<string, { id: number | null; name: string; stops: Delivery[] }>();
  for (const d of items) {
    const key = String(d.driver_id ?? 'none');
    const g = groups.get(key) ?? { id: d.driver_id, name: d.driver_name ?? 'Sem entregador', stops: [] };
    g.stops.push(d);
    groups.set(key, g);
  }
  const list = [...groups.values()].sort((a, b) => (a.id == null ? 1 : b.id == null ? -1 : a.name.localeCompare(b.name)));

  return (
    <div className="stack loose">
      <PageHeader title="Planejamento de rotas" subtitle={<span>{longDate(date)}</span>}>
        <Button iconOnly size="sm" aria-label="Dia anterior" onClick={() => setDate(addDays(date, -1))} icon={<ChevronLeft size={16} />} />
        <input type="date" className="input" style={{ width: 160, minHeight: 34 }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Data da rota" />
        <Button iconOnly size="sm" aria-label="Próximo dia" onClick={() => setDate(addDays(date, 1))} icon={<ChevronRight size={16} />} />
      </PageHeader>
      {!config.route_optimization && (
        <div className="banner tone-info small">
          <Info size={16} />
          <span>
            Ordem das paradas definida manualmente (arraste ou use as setas). A otimização automática de rotas precisa de um serviço de mapas externo, que ainda não
            está configurado.
          </span>
        </div>
      )}
      {res.error && !res.data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton />
      ) : list.length === 0 ? (
        <div className="card">
          <EmptyState icon={<RouteIcon size={22} />} title="Nenhuma entrega agendada para este dia." />
        </div>
      ) : (
        <div className="routes">
          {list.map((g) => (
            <RouteColumn key={`${date}-${g.id}`} driverId={g.id} driverName={g.name} stops={g.stops} date={date} />
          ))}
        </div>
      )}
    </div>
  );
}
