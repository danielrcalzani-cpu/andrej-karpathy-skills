import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  History,
  Info,
  LogOut,
  MapPin,
  MessageCircle,
  Package,
  PackageCheck,
  RefreshCw,
  StickyNote,
  Truck,
  WifiOff,
} from 'lucide-react';
import {
  formatAddress,
  formatDateTime,
  greeting,
  isFinal,
  itemLine,
  longDate,
  periodLabel,
  problemLabel,
  relativeDay,
  shortLocation,
} from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { post } from '../../api.ts';
import { navigate, safeStorage, useOnline, useResource, useRoute, useSession } from '../../lib.tsx';
import { Badge, Button, EmptyState, ErrorState, ProgressBar, Skeleton, StatusBadge, UrgencyBadge, cx } from '../../components/ui.tsx';
import { Checklist, NavButtons, ProblemDialog, ProofDialog, WhatsAppButton, WhatsAppDialog, useAction } from '../../components/actions.tsx';
import type { Detail } from '../../components/DeliveryDrawer.tsx';
import { ProofView } from '../../components/DeliveryDrawer.tsx';

interface Cached {
  at: number;
  items: Delivery[];
}

/** Lista do entregador com cópia local (só texto) para consulta sem internet. */
function useMyDeliveries() {
  const { user } = useSession();
  const key = `mercatto:entregas:${user.id}`;
  const res = useResource<{ items: Delivery[] }>('/api/deliveries');
  const [cached] = useState(() => safeStorage.get<Cached>(key));
  useEffect(() => {
    if (res.data) safeStorage.set(key, { at: Date.now(), items: res.data.items });
  }, [res.data, key]);
  const items = res.data?.items ?? (res.error ? cached?.items : undefined);
  const stale = !res.data && !!res.error && !!cached;
  return { ...res, items, stale, cachedAt: cached?.at ?? null };
}

function Address({ d }: { d: Delivery }) {
  const a = formatAddress(d);
  return (
    <div className="row top" style={{ gap: 10 }}>
      <MapPin size={18} className="muted" style={{ marginTop: 2, flexShrink: 0 }} aria-hidden />
      <div>
        <div className="strong">{a.line1 || 'Endereço não informado'}</div>
        {a.line2 && <div className="small muted">{a.line2}</div>}
        {d.reference_point && <div className="small muted">Referência: {d.reference_point}</div>}
      </div>
    </div>
  );
}

function When({ d, today }: { d: Delivery; today: string }) {
  if (!d.delivery_date) return null;
  const late = d.delivery_date < today && !isFinal(d.status);
  return (
    <span className={cx('row small', late && 'strong')} style={{ color: late ? 'var(--danger-text)' : undefined }}>
      <Clock size={15} aria-hidden />
      {late ? `Atrasada — era ${relativeDay(d.delivery_date, today).toLowerCase()}` : relativeDay(d.delivery_date, today)} · {periodLabel(d.delivery_period)}
      {d.scheduled_start_time ? ` · ${d.scheduled_start_time}${d.scheduled_end_time ? `–${d.scheduled_end_time}` : ''}` : ''}
    </span>
  );
}

function Materials({ d }: { d: Delivery }) {
  if (!d.items.length && !d.materials_notes) return null;
  return (
    <div className="stack tight">
      <span className="eyebrow row">
        <Package size={13} /> Materiais
      </span>
      {d.items.map((i) => (
        <span key={i.id} className="small">
          {itemLine(i)}
          {i.loaded && <CheckCircle2 size={13} color="#16A34A" style={{ marginLeft: 6, verticalAlign: -2 }} aria-label="carregado" />}
        </span>
      ))}
      {d.materials_notes && <span className="small muted" style={{ whiteSpace: 'pre-line' }}>{d.materials_notes}</span>}
    </div>
  );
}

/** Ações principais. Iniciar entrega é um toque; confirmar e problema abrem um painel de confirmação. */
function DriverActions({ d, offline }: { d: Delivery; offline: boolean }) {
  const [dialog, setDialog] = useState<null | 'proof' | 'problem' | 'wa'>(null);
  const { busy, run } = useAction();
  const start = async () => {
    const r = await run(() => post(`/api/deliveries/${d.id}/start`), 'Entrega iniciada. Bom trajeto!');
    if (r && d.receiver_whatsapp) setDialog('wa');
  };
  const canFinish = ['pronta', 'em_rota', 'problema'].includes(d.status);
  return (
    <div className="stack">
      <div className="action-grid">
        <NavButtons delivery={d} tiles />
        <WhatsAppButton delivery={d} tile template={d.status === 'em_rota' ? 'a_caminho' : 'problema'} />
      </div>
      {d.status === 'aguardando_separacao' && (
        <div className="banner tone-warning small">
          <AlertTriangle size={16} />
          <span>O material desta entrega ainda não foi conferido pelo depósito. Confirme com o escritório antes de sair.</span>
        </div>
      )}
      {d.status === 'pronta' && (
        <Button variant="primary" size="lg" block icon={<Truck size={20} />} loading={busy} disabled={offline} onClick={start}>
          Iniciar entrega
        </Button>
      )}
      {canFinish && (
        <Button variant={d.status === 'em_rota' ? 'success' : 'default'} size="lg" block icon={<PackageCheck size={20} />} disabled={offline} onClick={() => setDialog('proof')}>
          Confirmar entrega
        </Button>
      )}
      {!isFinal(d.status) && (
        <Button variant="danger-outline" size="lg" block icon={<AlertTriangle size={20} />} disabled={offline} onClick={() => setDialog('problem')}>
          Informar problema
        </Button>
      )}
      {offline && <p className="tiny muted">Sem conexão: as ações ficam disponíveis quando a internet voltar.</p>}
      {dialog === 'proof' && <ProofDialog delivery={d} open onClose={() => setDialog(null)} />}
      {dialog === 'problem' && <ProblemDialog delivery={d} open onClose={() => setDialog(null)} />}
      {dialog === 'wa' && <WhatsAppDialog delivery={d} open template="a_caminho" onClose={() => setDialog(null)} />}
    </div>
  );
}

function NextCard({ d, today, offline, stop }: { d: Delivery; today: string; offline: boolean; stop: number }) {
  return (
    <article className="next-card" aria-label="Próxima entrega">
      <div className="next-head stack tight">
        <div className="row between">
          <span className="eyebrow">Próxima entrega · parada {stop}</span>
          <StatusBadge status={d.status} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.02em' }}>{d.customer_name}</h2>
        <div className="row wrap small" style={{ color: '#d1d5db' }}>
          {d.order_number && <span>Pedido #{d.order_number}</span>}
          {d.urgency === 'alta' && (
            <span className="badge tone-danger">
              <Flame size={12} /> Urgente
            </span>
          )}
        </div>
      </div>
      <div className="next-body">
        <Address d={d} />
        <When d={d} today={today} />
        <Materials d={d} />
        {d.driver_notes && (
          <div className="banner tone-accent small">
            <StickyNote size={16} />
            <span style={{ whiteSpace: 'pre-line' }}>{d.driver_notes}</span>
          </div>
        )}
        <DriverActions d={d} offline={offline} />
        <Button variant="ghost" block onClick={() => navigate(`/entrega/${d.id}`)}>
          Ver detalhes e conferir carga <ChevronRight size={16} />
        </Button>
      </div>
    </article>
  );
}

function StopRow({ d, n, today }: { d: Delivery; n?: number; today: string }) {
  const done = d.status === 'entregue';
  return (
    <button type="button" className={cx('card hoverable row', done && 'done')} style={{ padding: 12, textAlign: 'left', width: '100%', cursor: 'pointer', opacity: done ? 0.65 : 1 }} onClick={() => navigate(`/entrega/${d.id}`)}>
      {n != null && <span className={cx('stop-num', done && 'done')}>{done ? <CheckCircle2 size={15} /> : n}</span>}
      <div className="grow stack" style={{ gap: 2 }}>
        <span className="strong truncate">
          {d.urgency === 'alta' && !done && <Flame size={14} color="#DC2626" aria-label="Urgente" style={{ verticalAlign: -2, marginRight: 4 }} />}
          {d.customer_name}
        </span>
        <span className="small muted truncate">{shortLocation(d) || 'Sem endereço'}</span>
        {!done && <When d={d} today={today} />}
      </div>
      {d.status === 'problema' ? <Badge tone="danger">Problema</Badge> : done ? <Badge tone="success">Entregue</Badge> : <ChevronRight size={18} className="muted" />}
    </button>
  );
}

function Home() {
  const { user, config, logout } = useSession();
  const online = useOnline();
  const res = useMyDeliveries();
  const today = config.today;
  const items = res.items;
  const offline = !online || res.stale;

  const current = (items ?? []).filter((d) => d.delivery_date && d.delivery_date <= today);
  const future = (items ?? []).filter((d) => d.delivery_date && d.delivery_date > today && !isFinal(d.status));
  const pending = current.filter((d) => !isFinal(d.status) && d.status !== 'problema');
  // A que já está em rota vem primeiro; depois a ordem definida pelo escritório.
  const next = pending.find((d) => d.status === 'em_rota') ?? pending[0];
  const rest = pending.filter((d) => d !== next);
  const problems = current.filter((d) => d.status === 'problema');
  const done = current.filter((d) => d.status === 'entregue');
  const totalToday = pending.length + problems.length + done.length;

  return (
    <div className="driver">
      <header className="driver-top">
        <div className="grow">
          <h1 className="h-page">
            {greeting(config.timezone)}, {user.name.split(' ')[0]}
          </h1>
          <div className="small muted">
            {longDate(today)}
          </div>
        </div>
        <Button variant="ghost" iconOnly aria-label="Atualizar" onClick={res.reload} icon={<RefreshCw size={18} className={res.loading ? 'spin' : undefined} />} />
        <Button variant="ghost" iconOnly aria-label="Sair" onClick={logout} icon={<LogOut size={18} />} />
      </header>

      {res.stale && (
        <div className="banner tone-warning small" style={{ marginBottom: 12 }}>
          <WifiOff size={16} />
          <span>Sem conexão. Mostrando a lista salva às {res.cachedAt ? formatDateTime(new Date(res.cachedAt).toISOString()).split(' às ')[1] : '—'}. Pode estar desatualizada.</span>
        </div>
      )}

      {!items ? (
        res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : (
          <Skeleton count={3} h={110} />
        )
      ) : (
        <div className="stack loose">
          <div className="mini-stats">
            <div className="mini-stat">
              <b>{pending.length}</b>
              <span>Pendentes</span>
            </div>
            <div className="mini-stat">
              <b>{done.length}</b>
              <span>Entregues</span>
            </div>
            <div className="mini-stat" style={problems.length ? { borderColor: '#fecaca', background: 'var(--danger-soft)' } : undefined}>
              <b>{problems.length}</b>
              <span>Problemas</span>
            </div>
          </div>

          {totalToday > 0 && (
            <div className="stack tight">
              <div className="row between small">
                <span className="strong">
                  {done.length} de {totalToday} entregas concluídas
                </span>
                <span className="muted">{Math.round((done.length / totalToday) * 100)}%</span>
              </div>
              <ProgressBar value={done.length} max={totalToday} />
            </div>
          )}

          {next ? (
            <NextCard d={next} today={today} offline={offline} stop={done.length + 1} />
          ) : totalToday > 0 ? (
            <div className="card">
              <EmptyState icon={<CheckCircle2 size={22} />} title="Tudo entregue por hoje!">
                {problems.length ? 'Ainda há entregas com problema aguardando o escritório.' : 'Bom trabalho.'}
              </EmptyState>
            </div>
          ) : (
            <div className="card">
              <EmptyState icon={<Truck size={22} />} title="Você não possui entregas atribuídas para hoje.">
                Quando o escritório agendar novas entregas para você, elas aparecem aqui.
              </EmptyState>
            </div>
          )}

          {rest.length > 0 && (
            <section className="stack">
              <h2 className="eyebrow">Depois ({rest.length})</h2>
              {rest.map((d, i) => (
                <StopRow key={d.id} d={d} n={done.length + 2 + i} today={today} />
              ))}
            </section>
          )}

          {problems.length > 0 && (
            <section className="stack">
              <h2 className="eyebrow" style={{ color: 'var(--danger-text)' }}>
                Com problema — aguardando o escritório
              </h2>
              {problems.map((d) => (
                <StopRow key={d.id} d={d} today={today} />
              ))}
            </section>
          )}

          {done.length > 0 && (
            <section className="stack">
              <h2 className="eyebrow">Concluídas hoje</h2>
              {done.map((d) => (
                <StopRow key={d.id} d={d} today={today} />
              ))}
            </section>
          )}

          {future.length > 0 && (
            <details className="card pad">
              <summary className="strong row" style={{ cursor: 'pointer' }}>
                <CalendarDays size={16} /> Próximos dias ({future.length})
              </summary>
              <div className="stack" style={{ marginTop: 12 }}>
                {future.map((d) => (
                  <StopRow key={d.id} d={d} today={today} />
                ))}
              </div>
            </details>
          )}

          <Button variant="ghost" icon={<History size={16} />} onClick={() => navigate('/anteriores')}>
            Entregas anteriores
          </Button>
        </div>
      )}
    </div>
  );
}

function DeliveryDetail({ id }: { id: number }) {
  const { config } = useSession();
  const online = useOnline();
  const res = useResource<Detail>(`/api/deliveries/${id}`);
  const cachedList = useMyDeliveries();
  const fallback = cachedList.items?.find((d) => d.id === id);
  const d = res.data?.delivery ?? (res.error ? fallback : undefined);
  const offline = !online || (!res.data && !!res.error);
  return (
    <div className="driver">
      <header className="driver-top">
        <Button variant="ghost" iconOnly aria-label="Voltar" onClick={() => (window.history.length > 1 ? window.history.back() : navigate('/'))} icon={<ArrowLeft size={20} />} />
        <div className="grow">
          <h1 className="h-section truncate" style={{ fontSize: 18 }}>
            {d?.customer_name ?? 'Entrega'}
          </h1>
          {d?.order_number && <div className="small muted">Pedido #{d.order_number}</div>}
        </div>
      </header>
      {!d ? (
        res.error ? (
          <ErrorState error={res.error} onRetry={res.reload} />
        ) : (
          <Skeleton count={3} />
        )
      ) : (
        <div className="stack loose">
          <div className="row wrap">
            <StatusBadge status={d.status} />
            <UrgencyBadge urgency={d.urgency} />
          </div>
          <div className="card pad stack">
            <Address d={d} />
            <When d={d} today={config.today} />
            {d.receiver_whatsapp && (
              <span className="row small">
                <MessageCircle size={15} aria-hidden /> Contato de quem recebe cadastrado
              </span>
            )}
          </div>
          {d.driver_notes && (
            <div className="banner tone-accent small">
              <StickyNote size={16} />
              <span style={{ whiteSpace: 'pre-line' }}>{d.driver_notes}</span>
            </div>
          )}
          {!isFinal(d.status) && <DriverActions d={d} offline={offline} />}

          <section className="stack">
            <h2 className="h-section row">
              <Package size={17} /> Conferência de carga
            </h2>
            {d.items.length ? (
              <Checklist delivery={d} stages={['loaded']} readOnly={offline || isFinal(d.status)} />
            ) : (
              <Materials d={d} />
            )}
            {!d.items.length && !d.materials_notes && <p className="small muted">Nenhum material listado.</p>}
          </section>

          {res.data && res.data.problems.length > 0 && (
            <section className="stack">
              <h2 className="h-section row">
                <AlertTriangle size={17} /> Problemas registrados
              </h2>
              {res.data.problems.map((p) => (
                <div key={p.id} className="card pad stack tight">
                  <div className="row between">
                    <span className="strong">{problemLabel(p.problem_type)}</span>
                    <Badge tone={p.resolved_at ? 'success' : 'danger'}>{p.resolved_at ? 'Resolvido' : 'Em aberto'}</Badge>
                  </div>
                  {p.description && <span className="small">{p.description}</span>}
                  <span className="tiny muted">{formatDateTime(p.reported_at)}</span>
                  {p.resolution_notes && <span className="small">Solução: {p.resolution_notes}</span>}
                </div>
              ))}
            </section>
          )}
          {res.data && res.data.proofs.length > 0 && (
            <section className="stack">
              <h2 className="h-section row">
                <CheckCircle2 size={17} /> Comprovante
              </h2>
              {res.data.proofs.map((p) => (
                <ProofView key={p.id} proof={p} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PastDeliveries() {
  const { config } = useSession();
  const res = useResource<{ items: Delivery[] }>('/api/deliveries?scope=history&sort=completed&limit=50');
  return (
    <div className="driver">
      <header className="driver-top">
        <Button variant="ghost" iconOnly aria-label="Voltar" onClick={() => navigate('/')} icon={<ArrowLeft size={20} />} />
        <h1 className="h-section" style={{ fontSize: 18 }}>
          Entregas anteriores
        </h1>
      </header>
      {res.error && !res.data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton count={4} h={70} />
      ) : res.data.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Info size={22} />} title="Nenhuma entrega concluída ainda." />
        </div>
      ) : (
        <div className="stack">
          {res.data.items.map((d) => (
            <StopRow key={d.id} d={d} today={config.today} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DriverApp() {
  const route = useRoute();
  const online = useOnline();
  const m = /^\/entrega\/(\d+)$/.exec(route.path);
  return (
    <>
      {!online && (
        <div className="offline" role="status">
          <WifiOff size={15} /> Sem internet — você pode consultar as entregas salvas
        </div>
      )}
      {m ? <DeliveryDetail id={Number(m[1])} /> : route.path === '/anteriores' ? <PastDeliveries /> : <Home />}
    </>
  );
}
