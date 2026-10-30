import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { addDays, formatDateBR, problemLabel } from '../../../shared/domain.ts';
import { useResource, useSession } from '../../lib.tsx';
import { EmptyState, ErrorState, Field, Segmented, Skeleton } from '../../components/ui.tsx';
import { PageHeader } from './AdminApp.tsx';

interface Report {
  from: string;
  to: string;
  total: number;
  canceled: number;
  delivered: number;
  pending: number;
  with_problems: number;
  completion_rate: number | null;
  per_driver: { driver: string; total: number; delivered: number; problems: number }[];
  avg_route_minutes: number | null;
  avg_route_samples: number;
  problem_types: { problem_type: string; n: number }[];
}

type Range = 'hoje' | '7d' | 'mes' | 'custom';

function Tile({ label, value, note }: { label: string; value: string | number; note?: string }) {
  return (
    <div className="stat" style={{ cursor: 'default' }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {note && <span className="tiny muted">{note}</span>}
    </div>
  );
}

/** Barras horizontais de uma única série, com rótulo direto e valor. */
function Bars({ rows, unit }: { rows: { label: string; value: number; title: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bars">
      {rows.map((r) => (
        <div key={r.label} className="bar-row" title={r.title}>
          <span className="truncate">{r.label}</span>
          <div className="bar-track" aria-hidden>
            <span className="bar-fill" style={{ width: `${(r.value / max) * 100}%`, borderRadius: 4 }} />
          </div>
          <span className="mono small strong">
            {r.value} <span className="muted tiny">{unit}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function Reports() {
  const { config } = useSession();
  const today = config.today;
  const [range, setRange] = useState<Range>('7d');
  const [custom, setCustom] = useState({ from: addDays(today, -29), to: today });
  const period =
    range === 'hoje'
      ? { from: today, to: today }
      : range === '7d'
        ? { from: addDays(today, -6), to: today }
        : range === 'mes'
          ? { from: `${today.slice(0, 8)}01`, to: today }
          : custom;
  const res = useResource<Report>(`/api/reports?from=${period.from}&to=${period.to}`, { poll: false });
  const r = res.data;

  return (
    <div className="stack loose">
      <PageHeader title="Relatórios" subtitle="Calculados a partir das entregas agendadas no período (pela data de entrega).">
        <Segmented<Range>
          label="Período"
          value={range}
          onChange={setRange}
          options={[
            { value: 'hoje', label: 'Hoje' },
            { value: '7d', label: 'Últimos 7 dias' },
            { value: 'mes', label: 'Este mês' },
            { value: 'custom', label: 'Personalizado' },
          ]}
        />
      </PageHeader>
      {range === 'custom' && (
        <div className="row wrap">
          <Field label="De" htmlFor="rp-from">
            <input id="rp-from" type="date" className="input" value={custom.from} onChange={(e) => e.target.value && setCustom({ ...custom, from: e.target.value })} />
          </Field>
          <Field label="Até" htmlFor="rp-to">
            <input id="rp-to" type="date" className="input" value={custom.to} onChange={(e) => e.target.value && setCustom({ ...custom, to: e.target.value })} />
          </Field>
        </div>
      )}
      {res.error ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !r ? (
        <Skeleton count={2} />
      ) : (
        <>
          <p className="small muted">
            {formatDateBR(r.from)} a {formatDateBR(r.to)}
            {r.canceled ? ` · ${r.canceled} cancelada(s) não entram no total` : ''}
          </p>
          <div className="stats">
            <Tile label="Entregas no período" value={r.total} />
            <Tile label="Entregues" value={r.delivered} />
            <Tile label="Pendentes" value={r.pending} />
            <Tile label="Com problemas" value={r.with_problems} />
            <Tile label="Taxa de conclusão" value={r.completion_rate == null ? '—' : `${Math.round(r.completion_rate * 100)}%`} />
            <Tile
              label="Tempo médio em rota"
              value={r.avg_route_minutes == null ? '—' : `${r.avg_route_minutes} min`}
              note={r.avg_route_samples ? `de “Em rota” a “Entregue”, ${r.avg_route_samples} entrega(s)` : 'sem registros suficientes'}
            />
          </div>
          {r.total === 0 ? (
            <div className="card">
              <EmptyState icon={<BarChart3 size={22} />} title="Nenhuma entrega agendada neste período." />
            </div>
          ) : (
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(380px, 100%), 1fr))', gap: 16 }}>
              <section className="card">
                <div className="card-head">
                  <h3 className="h-section">Entregas por entregador</h3>
                </div>
                <div className="card-body stack">
                  <Bars rows={r.per_driver.map((d) => ({ label: d.driver, value: d.total, title: `${d.driver}: ${d.total} agendadas, ${d.delivered} entregues, ${d.problems} com problema` }))} unit="entregas" />
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Entregador</th>
                          <th>Agendadas</th>
                          <th>Entregues</th>
                          <th>Com problema</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.per_driver.map((d) => (
                          <tr key={d.driver}>
                            <td>{d.driver}</td>
                            <td className="mono">{d.total}</td>
                            <td className="mono">{d.delivered}</td>
                            <td className="mono">{d.problems}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
              <section className="card">
                <div className="card-head">
                  <h3 className="h-section">Problemas mais frequentes</h3>
                </div>
                <div className="card-body">
                  {r.problem_types.length === 0 ? (
                    <p className="small muted">Nenhum problema registrado no período.</p>
                  ) : (
                    <Bars rows={r.problem_types.map((p) => ({ label: problemLabel(p.problem_type), value: p.n, title: `${problemLabel(p.problem_type)}: ${p.n}` }))} unit="ocorr." />
                  )}
                </div>
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
