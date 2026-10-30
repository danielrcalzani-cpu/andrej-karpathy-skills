import type { ReactNode } from 'react';
import { AlertTriangle, CalendarClock, CalendarDays, CheckCircle2, ClipboardCheck, PackageCheck, Sunrise, Truck } from 'lucide-react';
import type { Delivery } from '../../../shared/domain.ts';
import { navigate, useResource, useSession } from '../../lib.tsx';
import { Badge, EmptyState, ErrorState, Skeleton } from '../../components/ui.tsx';
import { DeliveryCard } from '../../components/DeliveryCard.tsx';
import { useSummary } from './AdminApp.tsx';

function Stat({ label, value, icon, tone, onClick }: { label: string; value?: number; icon: ReactNode; tone: string; onClick: () => void }) {
  return (
    <button type="button" className="stat" onClick={onClick} aria-label={`${label}: ${value ?? '…'}. Ver entregas`}>
      <span className={`stat-icon tone-${tone}`} aria-hidden>
        {icon}
      </span>
      <span className="stat-value">{value ?? '–'}</span>
      <span className="stat-label">{label}</span>
    </button>
  );
}

export function Overview() {
  const { config } = useSession();
  const { summary: s } = useSummary();
  const today = config.today;
  const problems = useResource<{ items: Delivery[] }>('/api/deliveries?status=problema&limit=20');
  const todayList = useResource<{ items: Delivery[]; total: number }>(`/api/deliveries?from=${today}&to=${today}&include_done=1&limit=60`);
  const urgentUnscheduled = useResource<{ items: Delivery[] }>('/api/deliveries?unscheduled=1&urgency=alta&limit=6');
  const overdue = useResource<{ items: Delivery[]; total: number }>('/api/deliveries?overdue=1&limit=6');

  const list = (path: string, params: Record<string, string>) => navigate(path, params);

  return (
    <div className="stack loose">
      <div className="stats">
        <Stat label="Entregas de hoje" value={s?.hoje} icon={<CalendarDays size={17} />} tone="neutral" onClick={() => list('/agenda', { view: 'day', date: today })} />
        <Stat label="Aguardando separação" value={s?.aguardando_separacao} icon={<ClipboardCheck size={17} />} tone="warning" onClick={() => list('/separacao', {})} />
        <Stat label="Prontas para entrega" value={s?.pronta} icon={<PackageCheck size={17} />} tone="accent" onClick={() => list('/agenda', { view: 'list', status: 'pronta' })} />
        <Stat label="Em rota" value={s?.em_rota} icon={<Truck size={17} />} tone="info" onClick={() => list('/agenda', { view: 'list', status: 'em_rota' })} />
        <Stat
          label="Entregues hoje"
          value={s?.entregues_hoje}
          icon={<CheckCircle2 size={17} />}
          tone="success"
          onClick={() => list('/agenda', { view: 'list', status: 'entregue', from: today, to: today, sort: 'completed' })}
        />
        <Stat label="Com problemas" value={s?.problema} icon={<AlertTriangle size={17} />} tone="danger" onClick={() => list('/agenda', { view: 'list', status: 'problema' })} />
      </div>

      {(problems.data?.items.length ?? 0) > 0 && (
        <section className="stack">
          <div className="row between">
            <h2 className="h-section row" style={{ color: 'var(--danger-text)' }}>
              <AlertTriangle size={17} /> Problemas que precisam de atenção
            </h2>
            <Badge tone="danger">{problems.data!.items.length}</Badge>
          </div>
          <div className="card-grid">
            {problems.data!.items.map((d) => (
              <DeliveryCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}

      <section className="stack">
        <div className="row between wrap">
          <h2 className="h-section row">
            <Sunrise size={17} /> Hoje
          </h2>
          {s && (
            <span className="small muted">
              {s.hoje_pendentes} pendente(s) · {s.entregues_hoje} entregue(s)
            </span>
          )}
        </div>
        {todayList.error && !todayList.data ? (
          <ErrorState error={todayList.error} onRetry={todayList.reload} />
        ) : !todayList.data ? (
          <Skeleton count={2} />
        ) : todayList.data.items.length === 0 ? (
          <div className="card">
            <EmptyState icon={<CalendarDays size={22} />} title="Nenhuma entrega agendada para hoje.">
              Veja as entregas aguardando agendamento para organizar o dia.
            </EmptyState>
          </div>
        ) : (
          <div className="card-grid">
            {todayList.data.items
              .filter((d) => d.status !== 'cancelada' && d.status !== 'problema')
              .map((d) => (
                <DeliveryCard key={d.id} d={d} />
              ))}
          </div>
        )}
      </section>

      {(overdue.data?.items.length ?? 0) > 0 && (
        <section className="stack">
          <div className="row between">
            <h2 className="h-section row">
              <CalendarClock size={17} /> Atrasadas (data já passou)
            </h2>
            <button type="button" className="btn sm ghost" onClick={() => list('/agenda', { view: 'list', overdue: '1' })}>
              Ver todas ({overdue.data!.total})
            </button>
          </div>
          <div className="card-grid">
            {overdue.data!.items.map((d) => (
              <DeliveryCard key={d.id} d={d} compact />
            ))}
          </div>
        </section>
      )}

      {(urgentUnscheduled.data?.items.length ?? 0) > 0 && (
        <section className="stack">
          <div className="row between">
            <h2 className="h-section row">
              <CalendarClock size={17} /> Urgentes sem data
            </h2>
            <button type="button" className="btn sm ghost" onClick={() => navigate('/agendamento')}>
              Abrir agendamento
            </button>
          </div>
          <div className="card-grid">
            {urgentUnscheduled.data!.items.map((d) => (
              <DeliveryCard key={d.id} d={d} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
