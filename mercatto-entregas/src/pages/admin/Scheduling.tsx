import { CalendarCheck, CalendarClock, UserX } from 'lucide-react';
import { addDays, formatDateBR, relativeDay } from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { useResource, useSession } from '../../lib.tsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui.tsx';
import { DeliveryCard } from '../../components/DeliveryCard.tsx';
import { useDrivers } from '../../components/actions.tsx';
import { PageHeader } from './AdminApp.tsx';

function Workload() {
  const { config } = useSession();
  const days = [0, 1, 2].map((n) => addDays(config.today, n));
  const d0 = useDrivers(days[0]);
  const d1 = useDrivers(days[1]);
  const d2 = useDrivers(days[2]);
  const all = [d0, d1, d2];
  const drivers = d0.data?.drivers.filter((d) => d.active) ?? [];
  if (!drivers.length) return null;
  return (
    <div className="card">
      <div className="card-head">
        <h3 className="h-section">Carga dos entregadores</h3>
        <span className="tiny muted">entregas agendadas</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Entregador</th>
              {days.map((d) => (
                <th key={d}>{relativeDay(d, config.today)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drivers.map((dr) => (
              <tr key={dr.id}>
                <td className="small strong">{dr.name}</td>
                {all.map((r, i) => {
                  const n = r.data?.drivers.find((x) => x.id === dr.id)?.day_count ?? 0;
                  return (
                    <td key={i} className="small mono">
                      {n} {n === 1 ? 'entrega' : 'entregas'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Scheduling() {
  const unscheduled = useResource<{ items: Delivery[]; total: number }>('/api/deliveries?unscheduled=1&sort=urgency&limit=200');
  const noDriver = useResource<{ items: Delivery[] }>('/api/deliveries?driver=none&sort=date&limit=100');
  const scheduledNoDriver = noDriver.data?.items.filter((d) => d.delivery_date) ?? [];

  return (
    <div className="stack loose">
      <PageHeader
        title="Aguardando agendamento"
        subtitle="Entregas sem data confirmada com o cliente. Elas não aparecem nas rotas até serem agendadas."
      />
      <Workload />
      {unscheduled.error && !unscheduled.data ? (
        <ErrorState error={unscheduled.error} onRetry={unscheduled.reload} />
      ) : !unscheduled.data ? (
        <Skeleton />
      ) : unscheduled.data.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CalendarCheck size={22} />} title="Tudo agendado!">
            Nenhuma entrega aguardando data no momento.
          </EmptyState>
        </div>
      ) : (
        <section className="stack">
          <h3 className="eyebrow row">
            <CalendarClock size={14} /> {unscheduled.data.total} sem data · urgentes primeiro
          </h3>
          <div className="card-grid">
            {unscheduled.data.items.map((d) => (
              <DeliveryCard key={d.id} d={d} />
            ))}
          </div>
        </section>
      )}

      {scheduledNoDriver.length > 0 && (
        <section className="stack">
          <h3 className="eyebrow row">
            <UserX size={14} /> Agendadas sem entregador ({scheduledNoDriver.length})
          </h3>
          <p className="small muted">Defina quem vai entregar. A primeira é para {formatDateBR(scheduledNoDriver[0]!.delivery_date)}.</p>
          <div className="card-grid">
            {scheduledNoDriver.map((d) => (
              <DeliveryCard key={d.id} d={d} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
