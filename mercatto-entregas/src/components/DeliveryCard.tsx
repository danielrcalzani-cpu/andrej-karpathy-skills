import { createContext, useContext, useState } from 'react';
import { CalendarClock, ClipboardCheck, Clock, MapPin, PackageCheck, Truck, User, Wrench } from 'lucide-react';
import { formatAddress, periodLabel, prepProgress, progressText, relativeDay, shortLocation } from '../../shared/domain.ts';
import type { Delivery } from '../../shared/domain.ts';
import { post } from '../api.ts';
import { useSession } from '../lib.tsx';
import { Badge, Button, StatusBadge, UrgencyBadge, cx } from './ui.tsx';
import { MaterialsSummary, NavButtons, ProofDialog, ScheduleDialog, WhatsAppButton, useAction } from './actions.tsx';

interface Panel {
  openDelivery: (id: number) => void;
  openForm: (d?: Delivery | null) => void;
}
export const PanelCtx = createContext<Panel>({ openDelivery: () => {}, openForm: () => {} });
export const usePanel = () => useContext(PanelCtx);

export function scheduleText(d: Delivery, today: string) {
  if (!d.delivery_date) return 'Sem data';
  const window = d.scheduled_start_time ? ` ${d.scheduled_start_time}${d.scheduled_end_time ? `–${d.scheduled_end_time}` : ''}` : '';
  return `${relativeDay(d.delivery_date, today)} · ${periodLabel(d.delivery_period)}${window}`;
}

/** Ação principal de acordo com a situação. */
export function PrimaryAction({ d, size = 'sm' }: { d: Delivery; size?: 'sm' }) {
  const { openDelivery } = usePanel();
  const [dialog, setDialog] = useState<null | 'schedule' | 'proof'>(null);
  const { busy, run } = useAction();
  let el = null;
  switch (d.status) {
    case 'aguardando_agendamento':
      el = (
        <Button size={size} variant="primary" icon={<CalendarClock size={15} />} onClick={() => setDialog('schedule')}>
          Agendar
        </Button>
      );
      break;
    case 'aguardando_separacao':
      el = (
        <Button size={size} variant="accent" icon={<ClipboardCheck size={15} />} onClick={() => openDelivery(d.id)}>
          Conferir material
        </Button>
      );
      break;
    case 'pronta':
      el = (
        <Button
          size={size}
          variant="primary"
          icon={<Truck size={15} />}
          loading={busy}
          disabled={!d.driver_id}
          title={!d.driver_id ? 'Defina um entregador' : undefined}
          onClick={() => run(() => post(`/api/deliveries/${d.id}/start`), 'Entrega marcada como em rota.')}
        >
          Marcar em rota
        </Button>
      );
      break;
    case 'em_rota':
      el = (
        <Button size={size} variant="success" icon={<PackageCheck size={15} />} onClick={() => setDialog('proof')}>
          Confirmar entrega
        </Button>
      );
      break;
    case 'problema':
      el = (
        <Button size={size} variant="danger" icon={<Wrench size={15} />} onClick={() => openDelivery(d.id)}>
          Resolver
        </Button>
      );
      break;
    default:
      el = (
        <Button size={size} onClick={() => openDelivery(d.id)}>
          Detalhes
        </Button>
      );
  }
  return (
    <>
      {el}
      {dialog === 'schedule' && <ScheduleDialog delivery={d} open onClose={() => setDialog(null)} />}
      {dialog === 'proof' && <ProofDialog delivery={d} open onClose={() => setDialog(null)} />}
    </>
  );
}

export function PrepIndicator({ d }: { d: Delivery }) {
  if (d.status === 'entregue' || d.status === 'cancelada') return null;
  if (d.prep_exception_reason) return <Badge tone="warning">Liberada por exceção</Badge>;
  if (d.items.length) {
    const p = prepProgress(d.items);
    return <Badge tone={p.done === p.total ? 'success' : 'warning'}>{progressText(p, 'conferidos')}</Badge>;
  }
  return <Badge tone={d.material_separated ? 'success' : 'warning'}>{d.material_separated ? 'Material separado' : 'Material não separado'}</Badge>;
}

export function DeliveryCard({ d, compact }: { d: Delivery; compact?: boolean }) {
  const { config } = useSession();
  const { openDelivery } = usePanel();
  const addr = formatAddress(d);
  const final = d.status === 'entregue' || d.status === 'cancelada';
  return (
    <article className={cx('card hoverable dcard', d.urgency === 'alta' && !final && 'urgent', d.urgency === 'media' && !final && 'urgent-media', final && 'done')}>
      <div className="row between top">
        <div className="stack tight grow">
          <button type="button" className="customer truncate" onClick={() => openDelivery(d.id)}>
            {d.customer_name}
          </button>
          <div className="meta">
            {d.order_number && <span>Pedido #{d.order_number}</span>}
            <span>
              <Clock size={13} aria-hidden /> {scheduleText(d, config.today)}
            </span>
          </div>
        </div>
        <div className="stack tight" style={{ alignItems: 'flex-end' }}>
          <StatusBadge status={d.status} />
          <UrgencyBadge urgency={d.urgency} />
        </div>
      </div>
      <div className="meta">
        <span className="truncate" style={{ maxWidth: '100%' }}>
          <MapPin size={13} aria-hidden /> {(compact ? shortLocation(d) : [addr.line1, addr.line2].filter(Boolean).join(' — ')) || 'Endereço não informado'}
        </span>
        <span>
          <User size={13} aria-hidden /> {d.driver_name ?? 'Sem entregador'}
        </span>
      </div>
      {!compact && <MaterialsSummary delivery={d} />}
      <div className="row wrap between">
        <PrepIndicator d={d} />
        {d.open_problems > 0 && d.status !== 'problema' && <Badge tone="danger">{d.open_problems} problema(s) em aberto</Badge>}
      </div>
      <div className="row wrap actions">
        <div className="primary-slot">
          <PrimaryAction d={d} />
        </div>
        <div className="quick-actions">
          {!final && !compact && (
            <>
              <NavButtons delivery={d} compact />
              <WhatsAppButton delivery={d} />
            </>
          )}
          {/* Entregues e canceladas já têm "Detalhes" como ação principal. */}
          {!final && (
            <Button size="sm" variant="ghost" className={!compact ? 'desktop-only' : undefined} onClick={() => openDelivery(d.id)}>
              Detalhes
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
