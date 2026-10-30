import { useEffect, useState } from 'react';
import { ArrowDownUp, CalendarDays, ChevronLeft, ChevronRight, Columns3, List, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  PERIODS,
  STATUSES,
  STATUS_META,
  URGENCIES,
  addDays,
  formatDateBR,
  longDate,
  periodLabel,
  shortLocation,
  startOfWeek,
  weekdayName,
} from '../../../shared/domain.ts';
import type { Delivery } from '../../../shared/domain.ts';
import { navigate, useDebounced, useResource, useRoute, useSession } from '../../lib.tsx';
import { Button, EmptyState, ErrorState, Field, Segmented, Skeleton, StatusBadge, UrgencyBadge, cx } from '../../components/ui.tsx';
import { DeliveryCard, PrepIndicator, PrimaryAction, usePanel } from '../../components/DeliveryCard.tsx';
import { useDrivers } from '../../components/actions.tsx';

type View = 'day' | 'week' | 'list';
interface Filters {
  q: string;
  status: string;
  driver: string;
  urgency: string;
  period: string;
  separated: string;
  include_done: boolean;
  from: string;
  to: string;
  overdue: string;
  sort: string;
}

function filtersFrom(p: URLSearchParams): Filters {
  return {
    q: p.get('q') ?? '',
    status: p.get('status') ?? '',
    driver: p.get('driver') ?? '',
    urgency: p.get('urgency') ?? '',
    period: p.get('period') ?? '',
    separated: p.get('separated') ?? '',
    include_done: p.get('done') === '1' || ['entregue', 'cancelada'].includes(p.get('status') ?? ''),
    from: p.get('from') ?? '',
    to: p.get('to') ?? '',
    overdue: p.get('overdue') ?? '',
    sort: p.get('sort') ?? 'date',
  };
}

function query(f: Filters, extra: Record<string, string> = {}) {
  const q = new URLSearchParams();
  if (f.q.trim()) q.set('q', f.q.trim());
  if (f.status) q.set('status', f.status);
  if (f.driver) q.set('driver', f.driver);
  if (f.urgency) q.set('urgency', f.urgency);
  if (f.period) q.set('period', f.period);
  if (f.separated) q.set('separated', f.separated);
  if (f.include_done) q.set('include_done', '1');
  if (f.overdue) q.set('overdue', '1');
  q.set('sort', f.sort);
  Object.entries(extra).forEach(([k, v]) => q.set(k, v));
  return q.toString();
}

const SORTS = [
  { value: 'date', label: 'Data' },
  { value: 'urgency', label: 'Urgência' },
  { value: 'customer', label: 'Cliente' },
  { value: 'driver', label: 'Entregador' },
  { value: 'status', label: 'Situação' },
  { value: 'completed', label: 'Conclusão' },
];

export function Agenda() {
  const { config } = useSession();
  const route = useRoute();
  const [view, setView] = useState<View>((route.params.get('view') as View) || 'day');
  const [date, setDate] = useState(route.params.get('date') || config.today);
  const [f, setF] = useState<Filters>(() => filtersFrom(route.params));
  const [advanced, setAdvanced] = useState(false);
  const [limit, setLimit] = useState(100);
  const debouncedQ = useDebounced(f.q, 300);
  const drivers = useDrivers();

  // Navegação vinda dos cartões do painel.
  useEffect(() => {
    if (route.path !== '/agenda') return;
    if (route.params.get('view')) setView(route.params.get('view') as View);
    if (route.params.get('date')) setDate(route.params.get('date')!);
    if ([...route.params.keys()].some((k) => k !== 'view' && k !== 'date')) setF(filtersFrom(route.params));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params.toString()]);

  const effective = { ...f, q: debouncedQ };
  const weekStart = startOfWeek(date);
  const url =
    view === 'day'
      ? `/api/deliveries?${query(effective, { from: date, to: date, limit: '300' })}`
      : view === 'week'
        ? `/api/deliveries?${query(effective, { from: weekStart, to: addDays(weekStart, 6), limit: '500' })}`
        : `/api/deliveries?${query(effective, { ...(f.from && { from: f.from }), ...(f.to && { to: f.to }), limit: String(limit) })}`;
  const res = useResource<{ items: Delivery[]; total: number }>(url);

  const set = (patch: Partial<Filters>) => {
    setF((x) => ({ ...x, ...patch }));
    setLimit(100);
  };
  const activeCount = [f.status, f.driver, f.urgency, f.period, f.from, f.to, f.overdue].filter(Boolean).length;
  const clear = () => {
    setF(filtersFrom(new URLSearchParams()));
    navigate('/agenda', { view });
  };

  const shiftDate = (n: number) => setDate((d) => addDays(d, view === 'week' ? n * 7 : n));

  return (
    <div className="stack loose">
      <div className="row between wrap" style={{ gap: 12 }}>
        <Segmented<View>
          label="Visualização"
          value={view}
          onChange={setView}
          options={[
            { value: 'day', label: 'Dia', icon: <CalendarDays size={15} /> },
            { value: 'week', label: 'Semana', icon: <Columns3 size={15} /> },
            { value: 'list', label: 'Lista', icon: <List size={15} /> },
          ]}
        />
        {view !== 'list' && (
          <div className="row">
            <Button iconOnly size="sm" aria-label={view === 'week' ? 'Semana anterior' : 'Dia anterior'} onClick={() => shiftDate(-1)} icon={<ChevronLeft size={16} />} />
            <input type="date" className="input" style={{ width: 160, minHeight: 34 }} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Data" />
            <Button iconOnly size="sm" aria-label={view === 'week' ? 'Próxima semana' : 'Próximo dia'} onClick={() => shiftDate(1)} icon={<ChevronRight size={16} />} />
            {date !== config.today && (
              <Button size="sm" variant="ghost" onClick={() => setDate(config.today)}>
                Hoje
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="card pad stack" style={{ padding: 12 }}>
        <div className="row wrap">
          <div className="input-icon grow" style={{ minWidth: 220 }}>
            <Search size={16} />
            <input
              className="input"
              type="search"
              placeholder="Buscar cliente, pedido, endereço ou bairro"
              aria-label="Buscar entregas"
              value={f.q}
              onChange={(e) => set({ q: e.target.value })}
            />
          </div>
          <div className="chip-scroll">
          <button type="button" className="chip" aria-pressed={f.separated === 'no'} onClick={() => set({ separated: f.separated === 'no' ? '' : 'no' })}>
            Só o que falta separar
          </button>
          <button type="button" className="chip" aria-pressed={f.include_done} onClick={() => set({ include_done: !f.include_done })}>
            Mostrar entregues
          </button>
          <Button size="sm" icon={<SlidersHorizontal size={15} />} onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
            Filtros{activeCount ? ` (${activeCount})` : ''}
          </Button>
          {(activeCount > 0 || f.q || f.separated || f.include_done) && (
            <Button size="sm" variant="ghost" icon={<X size={15} />} onClick={clear}>
              Limpar
            </Button>
          )}
          </div>
        </div>
        {advanced && (
          <div className="form-grid">
            <Field className="span-2" label="Situação" htmlFor="flt-status">
              <select id="flt-status" className="select" value={f.status} onChange={(e) => set({ status: e.target.value, include_done: ['entregue', 'cancelada'].includes(e.target.value) || f.include_done })}>
                <option value="">Todas</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="span-2" label="Entregador" htmlFor="flt-driver">
              <select id="flt-driver" className="select" value={f.driver} onChange={(e) => set({ driver: e.target.value })}>
                <option value="">Todos</option>
                <option value="none">Sem entregador</option>
                {drivers.data?.drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="span-2" label="Urgência" htmlFor="flt-urg">
              <select id="flt-urg" className="select" value={f.urgency} onChange={(e) => set({ urgency: e.target.value })}>
                <option value="">Todas</option>
                <option value="any">Qualquer marcação</option>
                {URGENCIES.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field className="span-2" label="Período" htmlFor="flt-period">
              <select id="flt-period" className="select" value={f.period} onChange={(e) => set({ period: e.target.value })}>
                <option value="">Todos</option>
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
                <option value="none">Sem período definido</option>
              </select>
            </Field>
            <Field className="span-2" label="Material" htmlFor="flt-sep">
              <select id="flt-sep" className="select" value={f.separated} onChange={(e) => set({ separated: e.target.value })}>
                <option value="">Todos</option>
                <option value="no">Falta separar/conferir</option>
                <option value="yes">Separado e conferido</option>
              </select>
            </Field>
            {view === 'list' && (
              <>
                <Field className="span-2" label="De" htmlFor="flt-from">
                  <input id="flt-from" type="date" className="input" value={f.from} onChange={(e) => set({ from: e.target.value })} />
                </Field>
                <Field className="span-2" label="Até" htmlFor="flt-to">
                  <input id="flt-to" type="date" className="input" value={f.to} onChange={(e) => set({ to: e.target.value })} />
                </Field>
              </>
            )}
          </div>
        )}
      </div>

      {res.error && !res.data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !res.data ? (
        <Skeleton />
      ) : view === 'day' ? (
        <DayView date={date} items={res.data.items} today={config.today} />
      ) : view === 'week' ? (
        <WeekView start={weekStart} items={res.data.items} today={config.today} onPick={(d) => (setDate(d), setView('day'))} />
      ) : (
        <ListView items={res.data.items} total={res.data.total} sort={f.sort} onSort={(s) => set({ sort: s })} onMore={() => setLimit((l) => l + 100)} loading={res.loading} />
      )}
    </div>
  );
}

const GROUPS: { key: string; label: string; match: (d: Delivery) => boolean }[] = [
  { key: 'manha', label: 'Manhã', match: (d) => d.delivery_period === 'manha' },
  { key: 'tarde', label: 'Tarde', match: (d) => d.delivery_period === 'tarde' },
  { key: 'noite', label: 'Noite', match: (d) => d.delivery_period === 'noite' },
  { key: 'combinado', label: 'Horário combinado', match: (d) => d.delivery_period === 'combinado' },
  { key: 'none', label: 'Sem período definido', match: (d) => !d.delivery_period || d.delivery_period === 'a_definir' },
];

function DayView({ date, items, today }: { date: string; items: Delivery[]; today: string }) {
  const groups = GROUPS.map((g) => ({ ...g, items: items.filter(g.match) })).filter((g) => g.items.length || g.key === 'manha' || g.key === 'tarde');
  return (
    <div className="stack loose">
      <div className="row between wrap">
        <h2 className="h-section">
          {longDate(date)} {date === today && <span className="badge tone-accent">Hoje</span>}
        </h2>
        <span className="small muted">{items.length} entrega(s)</span>
      </div>
      {items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CalendarDays size={22} />} title={date === today ? 'Nenhuma entrega agendada para hoje.' : 'Nenhuma entrega agendada para este dia.'}>
            Use “Aguardando Agendamento” para marcar entregas pendentes.
          </EmptyState>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="stack">
            <div className="row">
              <h3 className="eyebrow">{g.label}</h3>
              <span className="badge tone-neutral">{g.items.length}</span>
            </div>
            {g.items.length === 0 ? (
              <p className="small muted">Nenhuma entrega neste período.</p>
            ) : (
              <div className="card-grid">
                {g.items.map((d) => (
                  <DeliveryCard key={d.id} d={d} />
                ))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  );
}

function WeekView({ start, items, today, onPick }: { start: string; items: Delivery[]; today: string; onPick: (d: string) => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  return (
    <div className="stack">
      <div className="small muted">
        Semana de {formatDateBR(days[0])} a {formatDateBR(days[6])} · {items.length} entrega(s)
      </div>
      <div className="week">
        {days.map((day) => {
          const list = items.filter((d) => d.delivery_date === day);
          return (
            <button key={day} type="button" className={cx('week-day', day === today && 'today')} onClick={() => onPick(day)} aria-label={`${weekdayName(day)}, ${formatDateBR(day)}: ${list.length} entregas`}>
              <div className="row between">
                <span className="small strong">
                  {weekdayName(day, true)} {formatDateBR(day).slice(0, 5)}
                </span>
                <span className="badge tone-neutral">{list.length}</span>
              </div>
              {list.slice(0, 6).map((d) => (
                <span
                  key={d.id}
                  className="week-pill"
                  style={{ borderLeftColor: d.urgency === 'alta' ? 'var(--danger)' : d.status === 'entregue' ? 'var(--success)' : d.status === 'problema' ? 'var(--danger)' : undefined }}
                  title={`${d.customer_name} — ${STATUS_META[d.status].label}`}
                >
                  {periodLabel(d.delivery_period).slice(0, 5)} · {d.customer_name}
                </span>
              ))}
              {list.length > 6 && <span className="tiny muted">+ {list.length - 6}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ListView({ items, total, sort, onSort, onMore, loading }: { items: Delivery[]; total: number; sort: string; onSort: (s: string) => void; onMore: () => void; loading: boolean }) {
  const { openDelivery } = usePanel();
  const header = (key: string, label: string) => (
    <th aria-sort={sort === key ? 'ascending' : undefined}>
      <button type="button" className="th-sort" onClick={() => onSort(key)}>
        {label} {sort === key && <ArrowDownUp size={12} />}
      </button>
    </th>
  );
  if (!items.length)
    return (
      <div className="card">
        <EmptyState icon={<Search size={22} />} title="Nenhuma entrega encontrada.">
          Ajuste a busca ou limpe os filtros.
        </EmptyState>
      </div>
    );
  return (
    <div className="stack">
      <div className="row between wrap">
        <span className="small muted">
          Mostrando {items.length} de {total}
        </span>
        <div className="row mobile-only">
          <label htmlFor="sort-m" className="small muted">
            Ordenar
          </label>
          <select id="sort-m" className="select" style={{ minHeight: 34, width: 150 }} value={sort} onChange={(e) => onSort(e.target.value)}>
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="card desktop-only">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {header('customer', 'Cliente')}
                <th>Local</th>
                {header('date', 'Data')}
                {header('driver', 'Entregador')}
                <th>Material</th>
                {header('status', 'Situação')}
                {header('urgency', 'Urgência')}
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>
                    <button type="button" className="th-sort strong" style={{ textTransform: 'none', letterSpacing: 0, fontSize: 14, color: 'var(--text)' }} onClick={() => openDelivery(d.id)}>
                      {d.customer_name}
                    </button>
                    {d.order_number && <div className="tiny muted">Pedido #{d.order_number}</div>}
                  </td>
                  <td className="small" style={{ maxWidth: 200 }}>
                    <div className="truncate">{shortLocation(d) || '—'}</div>
                  </td>
                  <td className="small nowrap">
                    {d.delivery_date ? (
                      <>
                        {formatDateBR(d.delivery_date)}
                        <div className="tiny muted">{periodLabel(d.delivery_period)}</div>
                      </>
                    ) : (
                      <span className="muted">Sem data</span>
                    )}
                  </td>
                  <td className="small">{d.driver_name ?? <span className="muted">—</span>}</td>
                  <td>
                    <PrepIndicator d={d} />
                  </td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>
                    <UrgencyBadge urgency={d.urgency} />
                  </td>
                  <td className="nowrap">
                    <PrimaryAction d={d} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="stack mobile-only">
        {items.map((d) => (
          <DeliveryCard key={d.id} d={d} compact />
        ))}
      </div>
      {items.length < total && (
        <Button onClick={onMore} loading={loading}>
          Carregar mais
        </Button>
      )}
    </div>
  );
}
