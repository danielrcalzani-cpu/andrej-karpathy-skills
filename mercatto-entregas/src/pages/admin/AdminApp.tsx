import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  BarChart3,
  Bell,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  MoreHorizontal,
  Smartphone,
  Plus,
  Route,
  Settings,
  Users,
} from 'lucide-react';
import { STATUS_META, formatDateTime, longDate } from '../../../shared/domain.ts';
import type { Delivery, Status } from '../../../shared/domain.ts';
import { post } from '../../api.ts';
import { initials, navigate, useResource, useRoute, useSession } from '../../lib.tsx';
import { currentUI, switchUI } from '../../ui.ts';
import { IS_ARTIFACT } from '../../target.ts';
import { Button, Modal, cx } from '../../components/ui.tsx';
import { PanelCtx } from '../../components/DeliveryCard.tsx';
import { DeliveryDrawer } from '../../components/DeliveryDrawer.tsx';
import { DeliveryForm } from '../../components/DeliveryForm.tsx';
import { Overview } from './Overview.tsx';
import { Agenda } from './Agenda.tsx';
import { Scheduling } from './Scheduling.tsx';
import { Preparation } from './Preparation.tsx';
import { Routes } from './Routes.tsx';
import { Drivers } from './Drivers.tsx';
import { HistoryPage } from './History.tsx';
import { Reports } from './Reports.tsx';
import { SettingsPage } from './Settings.tsx';

export interface Summary {
  today: string;
  hoje: number;
  hoje_pendentes: number;
  aguardando_separacao: number;
  pronta: number;
  em_rota: number;
  entregues_hoje: number;
  problema: number;
  aguardando_agendamento: number;
  atrasadas: number;
}
const SummaryCtx = createContext<{ summary?: Summary; lastUpdated: number | null }>({ lastUpdated: null });
export const useSummary = () => useContext(SummaryCtx);

const NAV: { path: string; label: string; icon: ReactNode; count?: (s: Summary) => number; alert?: boolean }[] = [
  { path: '/visao-geral', label: 'Visão Geral', icon: <LayoutDashboard size={18} /> },
  { path: '/agenda', label: 'Agenda de Entregas', icon: <CalendarDays size={18} /> },
  { path: '/agendamento', label: 'Aguardando Agendamento', icon: <CalendarClock size={18} />, count: (s) => s.aguardando_agendamento },
  { path: '/separacao', label: 'Separação de Materiais', icon: <ClipboardCheck size={18} />, count: (s) => s.aguardando_separacao },
  { path: '/rotas', label: 'Rotas', icon: <Route size={18} /> },
  { path: '/entregadores', label: 'Entregadores', icon: <Users size={18} /> },
  { path: '/historico', label: 'Histórico', icon: <History size={18} /> },
  { path: '/relatorios', label: 'Relatórios', icon: <BarChart3 size={18} /> },
  { path: '/configuracoes', label: 'Configurações', icon: <Settings size={18} /> },
];

interface Notifs {
  alerts: { kind: string; tone: 'danger' | 'warning'; text: string; delivery_id: number; customer_name: string }[];
  events: { id: number; type: string; new_status: Status | null; changed_at: string; delivery_id: number; customer_name: string; changed_by_name: string | null; unread: boolean }[];
  unread: number;
}

function eventLabel(e: Notifs['events'][number]) {
  if (e.type === 'problema') return 'informou um problema';
  if (e.type === 'reagendamento') return 'reagendou';
  if (e.type === 'problema_resolvido') return 'resolveu o problema de';
  if (e.new_status) return `marcou como ${STATUS_META[e.new_status].label.toLowerCase()}`;
  return e.type;
}

function NotificationsPanel({ open, onClose, data, onOpenDelivery }: { open: boolean; onClose: () => void; data?: Notifs; onOpenDelivery: (id: number) => void }) {
  const go = (id: number) => {
    onClose();
    onOpenDelivery(id);
  };
  return (
    <Modal open={open} onClose={onClose} title="Avisos" subtitle="Atualizado automaticamente a cada 30 segundos" variant="drawer">
      <div className="stack loose">
        <section className="stack">
          <h3 className="eyebrow">Precisa de atenção</h3>
          {!data?.alerts.length ? (
            <p className="small muted">Nada pendente no momento.</p>
          ) : (
            data.alerts.map((a) => (
              <button key={`${a.kind}-${a.delivery_id}`} type="button" className={cx('banner small', `tone-${a.tone}`)} style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => go(a.delivery_id)}>
                <span className="grow">
                  <b>{a.customer_name}</b> — {a.text}
                </span>
              </button>
            ))
          )}
        </section>
        <section className="stack">
          <h3 className="eyebrow">Atividade recente</h3>
          {!data?.events.length ? (
            <p className="small muted">Sem atividade nos últimos 3 dias.</p>
          ) : (
            data.events.map((e) => (
              <button key={e.id} type="button" className="card pad row top" style={{ textAlign: 'left', cursor: 'pointer', padding: 12 }} onClick={() => go(e.delivery_id)}>
                {e.unread && <span className="badge tone-info">Novo</span>}
                <span className="grow small">
                  <b>{e.changed_by_name ?? 'Sistema'}</b> {eventLabel(e)} <b>{e.customer_name}</b>
                  <div className="tiny muted">{formatDateTime(e.changed_at)}</div>
                </span>
              </button>
            ))
          )}
        </section>
      </div>
    </Modal>
  );
}

export default function AdminApp() {
  const { user, logout, config } = useSession();
  const route = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerId, setDrawerId] = useState<number | null>(null);
  const [form, setForm] = useState<{ open: boolean; delivery: Delivery | null }>({ open: false, delivery: null });
  const [notifOpen, setNotifOpen] = useState(false);
  const summary = useResource<Summary>('/api/summary');
  const notifs = useResource<Notifs>('/api/notifications');

  useEffect(() => {
    setMenuOpen(false);
    setNotifOpen(false);
  }, [route.path]);
  useEffect(() => {
    if (route.path === '/') navigate('/visao-geral');
  }, [route.path]);

  const panel = useMemo(
    () => ({
      openDelivery: (id: number) => setDrawerId(id),
      openForm: (d?: Delivery | null) => setForm({ open: true, delivery: d ?? null }),
    }),
    [],
  );

  const current = NAV.find((n) => route.path === n.path || route.path.startsWith(n.path + '/')) ?? NAV[0]!;
  const s = summary.data;
  const page = (() => {
    switch (current.path) {
      case '/agenda':
        return <Agenda />;
      case '/agendamento':
        return <Scheduling />;
      case '/separacao':
        return <Preparation />;
      case '/rotas':
        return <Routes />;
      case '/entregadores':
        return <Drivers />;
      case '/historico':
        return <HistoryPage />;
      case '/relatorios':
        return <Reports />;
      case '/configuracoes':
        return <SettingsPage />;
      default:
        return <Overview />;
    }
  })();

  const openNotifs = () => {
    setNotifOpen(true);
    if (notifs.data?.unread) post('/api/notifications/seen').then(notifs.reload, () => {});
  };
  const alertCount = (notifs.data?.unread ?? 0) + (notifs.data?.alerts.filter((a) => a.kind === 'problema').length ?? 0);

  return (
    <PanelCtx.Provider value={panel}>
      <SummaryCtx.Provider value={{ summary: s, lastUpdated: summary.lastUpdated }}>
        <div className="shell">
          {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} aria-hidden />}
          <aside className={cx('sidebar', menuOpen && 'open')} aria-label="Navegação principal">
            <div className="brand">
              <div className="brand-mark">M</div>
              <div>
                <div className="brand-name">Mercatto Decor</div>
                <div className="brand-sub">Logística de entregas</div>
              </div>
            </div>
            <nav className="nav">
              {NAV.map((n) => {
                const c = s && n.count ? n.count(s) : 0;
                return (
                  <a key={n.path} href={`#${n.path}`} onClick={(e) => (e.preventDefault(), navigate(n.path))} aria-current={current.path === n.path ? 'page' : undefined}>
                    {n.icon}
                    {n.label}
                    {c > 0 && <span className="count">{c}</span>}
                  </a>
                );
              })}
            </nav>
            <button type="button" className="nav-switch" onClick={() => switchUI(currentUI() === 'pc' ? 'mobile' : 'pc')}>
              {currentUI() === 'pc' ? <Smartphone size={16} /> : <Monitor size={16} />}
              {currentUI() === 'pc' ? 'Abrir versão para celular' : 'Abrir versão para computador'}
            </button>
            <div className="sidebar-foot">
              <div className="avatar" aria-hidden>
                {initials(user.name)}
              </div>
              <div className="grow">
                <div className="small truncate" style={{ color: '#fff' }}>
                  {user.name}
                </div>
                <div className="tiny" style={{ color: '#9ca3af' }}>
                  Administrador
                </div>
              </div>
              {!IS_ARTIFACT && (
                <button type="button" className="btn ghost icon sm" style={{ color: '#d1d5db' }} onClick={logout} aria-label="Sair">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </aside>

          <div className="main">
            <header className="topbar">
              <Button variant="ghost" iconOnly className="mobile-only" aria-label="Abrir menu" onClick={() => setMenuOpen(true)} icon={<Menu size={20} />} />
              <div className="grow">
                <h1 className="h-page" style={{ fontSize: 18 }}>
                  {current.label}
                </h1>
                <div className="tiny muted desktop-only">
                  {longDate(config.today)}
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <Button variant="ghost" iconOnly aria-label={`Avisos${alertCount ? ` (${alertCount})` : ''}`} onClick={openNotifs} icon={<Bell size={20} />} />
                {alertCount > 0 && <span className="bell-dot">{alertCount}</span>}
              </div>
              <Button variant="primary" icon={<Plus size={17} />} className="desktop-only" onClick={() => panel.openForm(null)}>
                Nova entrega
              </Button>
            </header>
            <main className="content" id="conteudo">
              {page}
            </main>
          </div>

          <nav className="bottom-nav" aria-label="Navegação rápida">
            <a href="#/visao-geral" onClick={(e) => (e.preventDefault(), navigate('/visao-geral'))} aria-current={current.path === '/visao-geral' ? 'page' : undefined}>
              <LayoutDashboard size={20} /> Início
            </a>
            <a href="#/agenda" onClick={(e) => (e.preventDefault(), navigate('/agenda'))} aria-current={current.path === '/agenda' ? 'page' : undefined}>
              <CalendarDays size={20} /> Agenda
            </a>
            <button type="button" onClick={() => panel.openForm(null)} aria-label="Nova entrega">
              <span className="fab">
                <Plus size={22} />
              </span>
            </button>
            <a href="#/separacao" onClick={(e) => (e.preventDefault(), navigate('/separacao'))} aria-current={current.path === '/separacao' ? 'page' : undefined}>
              <ClipboardCheck size={20} /> Separação
              {s && s.aguardando_separacao > 0 && <span className="bell-dot" style={{ right: '22%' }}>{s.aguardando_separacao}</span>}
            </a>
            <button type="button" onClick={() => setMenuOpen(true)} aria-current={['/visao-geral', '/agenda', '/separacao'].includes(current.path) ? undefined : 'page'}>
              <MoreHorizontal size={20} /> Mais
            </button>
          </nav>

          <DeliveryDrawer id={drawerId} onClose={() => setDrawerId(null)} onEdit={(d) => panel.openForm(d)} />
          <DeliveryForm
            open={form.open}
            delivery={form.delivery}
            onClose={() => setForm({ open: false, delivery: null })}
            onSaved={(id) => {
              setForm({ open: false, delivery: null });
              setDrawerId(id);
            }}
          />
          <NotificationsPanel open={notifOpen} onClose={() => setNotifOpen(false)} data={notifs.data} onOpenDelivery={panel.openDelivery} />
        </div>
      </SummaryCtx.Provider>
    </PanelCtx.Provider>
  );
}

export function PageHeader({ title, children, subtitle }: { title?: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="row between wrap" style={{ marginBottom: 16, gap: 12 }}>
      <div className="stack tight">
        {title && <h2 className="h-section" style={{ fontSize: 17 }}>{title}</h2>}
        {subtitle && <div className="small muted">{subtitle}</div>}
      </div>
      {children && <div className="row wrap">{children}</div>}
    </div>
  );
}
