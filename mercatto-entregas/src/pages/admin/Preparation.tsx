import { useState } from 'react';
import { ClipboardCheck, PackageCheck, Truck } from 'lucide-react';
import { relativeDay } from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { post } from '../../api.ts';
import { useResource, useSession } from '../../lib.tsx';
import { Button, EmptyState, ErrorState, Segmented, Skeleton, StatusBadge, UrgencyBadge, cx } from '../../components/ui.tsx';
import { Checklist, MaterialsSummary, useAction } from '../../components/actions.tsx';
import { usePanel } from '../../components/DeliveryCard.tsx';
import { PageHeader } from './AdminApp.tsx';

function PrepCard({ d, stages }: { d: Delivery; stages: ('prepared' | 'checked' | 'loaded')[] }) {
  const { config } = useSession();
  const { openDelivery } = usePanel();
  const { busy, run } = useAction();
  return (
    <article className={cx('card dcard', d.urgency === 'alta' && 'urgent')}>
      <div className="row between top">
        <div className="stack tight grow">
          <button type="button" className="customer truncate" onClick={() => openDelivery(d.id)}>
            {d.customer_name}
          </button>
          <span className="small muted">
            {d.order_number ? `Pedido #${d.order_number} · ` : ''}
            {d.delivery_date ? relativeDay(d.delivery_date, config.today) : 'Sem data'} · {d.driver_name ?? 'Sem entregador'}
          </span>
        </div>
        <div className="stack tight" style={{ alignItems: 'flex-end' }}>
          <StatusBadge status={d.status} />
          <UrgencyBadge urgency={d.urgency} />
        </div>
      </div>
      {d.items.length ? (
        <Checklist delivery={d} stages={stages} />
      ) : (
        <div className="stack tight">
          <MaterialsSummary delivery={d} />
          <div className="row between wrap">
            <span className="small muted">Sem itens cadastrados — confirme pelo campo “Material separado?”.</span>
            {!d.material_separated && (
              <Button size="sm" variant="accent" loading={busy} icon={<PackageCheck size={15} />} onClick={() => run(() => post(`/api/deliveries/${d.id}/material-separated`, { value: true }), 'Material marcado como separado.')}>
                Marcar como separado
              </Button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

export function Preparation() {
  const [tab, setTab] = useState<'separar' | 'carregar'>('separar');
  const pending = useResource<{ items: Delivery[]; total: number }>('/api/deliveries?separated=no&sort=date&limit=200');
  const loading = useResource<{ items: Delivery[] }>('/api/deliveries?status=pronta&sort=date&limit=200');
  const res = tab === 'separar' ? pending : loading;
  const items = tab === 'separar' ? (pending.data?.items ?? []) : (loading.data?.items ?? []).filter((d) => d.items.some((i) => !i.loaded));
  return (
    <div className="stack loose">
      <PageHeader title="Separação de materiais" subtitle="Separado (no depósito) → Conferido → Carregado (no veículo).">
        <Segmented
          label="Etapa"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'separar', label: `Separar e conferir${pending.data ? ` (${pending.data.total})` : ''}`, icon: <ClipboardCheck size={15} /> },
            { value: 'carregar', label: 'Carregamento', icon: <Truck size={15} /> },
          ]}
        />
      </PageHeader>
      {res.error && !res.data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ClipboardCheck size={22} />} title={tab === 'separar' ? 'Nenhuma entrega pendente de separação.' : 'Nenhuma entrega pronta aguardando carregamento.'} />
        </div>
      ) : (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(420px, 100%), 1fr))' }}>
          {items.map((d) => (
            <PrepCard key={d.id} d={d} stages={tab === 'separar' ? ['prepared', 'checked'] : ['loaded']} />
          ))}
        </div>
      )}
    </div>
  );
}
