import { useState } from 'react';
import { Camera, History as HistoryIcon, Search } from 'lucide-react';
import { formatDateBR, formatDateTime } from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { useDebounced, useResource } from '../../lib.tsx';
import { Button, EmptyState, ErrorState, Segmented, Skeleton, StatusBadge } from '../../components/ui.tsx';
import { usePanel } from '../../components/DeliveryCard.tsx';
import { PageHeader } from './AdminApp.tsx';

export function HistoryPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'entregue' | 'cancelada'>('entregue');
  const [limit, setLimit] = useState(50);
  const dq = useDebounced(q);
  const res = useResource<{ items: Delivery[]; total: number }>(`/api/deliveries?status=${status}&sort=completed&limit=${limit}${dq ? `&q=${encodeURIComponent(dq)}` : ''}`);
  const { openDelivery } = usePanel();
  return (
    <div className="stack loose">
      <PageHeader title="Histórico" subtitle="Entregas concluídas e canceladas, com comprovante. Abra uma entrega para ver foto, quem recebeu e o histórico completo.">
        <Segmented
          label="Situação"
          value={status}
          onChange={(s) => (setStatus(s), setLimit(50))}
          options={[
            { value: 'entregue', label: 'Entregues' },
            { value: 'cancelada', label: 'Canceladas' },
          ]}
        />
      </PageHeader>
      <div className="input-icon">
        <Search size={16} />
        <input className="input" type="search" placeholder="Buscar cliente, pedido ou endereço" aria-label="Buscar no histórico" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {res.error && !res.data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton count={4} h={56} />
      ) : res.data.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<HistoryIcon size={22} />} title="Nenhuma entrega no histórico." />
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Pedido</th>
                  <th>Data agendada</th>
                  <th>Entregador</th>
                  <th>{status === 'entregue' ? 'Concluída em' : 'Atualizada em'}</th>
                  <th>Situação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {res.data.items.map((d) => (
                  <tr key={d.id}>
                    <td className="strong">{d.customer_name}</td>
                    <td>{d.order_number ?? '—'}</td>
                    <td>{d.delivery_date ? formatDateBR(d.delivery_date) : '—'}</td>
                    <td>{d.driver_name ?? '—'}</td>
                    <td className="small">{formatDateTime(d.completed_at ?? d.updated_at)}</td>
                    <td>
                      <StatusBadge status={d.status} />
                    </td>
                    <td>
                      <Button size="sm" icon={status === 'entregue' ? <Camera size={14} /> : undefined} onClick={() => openDelivery(d.id)}>
                        {status === 'entregue' ? 'Comprovante' : 'Detalhes'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {res.data && res.data.items.length < res.data.total && (
        <Button onClick={() => setLimit((l) => l + 50)} loading={res.loading}>
          Carregar mais ({res.data.items.length} de {res.data.total})
        </Button>
      )}
    </div>
  );
}
