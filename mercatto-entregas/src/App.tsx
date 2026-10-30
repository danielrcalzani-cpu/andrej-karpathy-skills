import { Component, Suspense, lazy, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { api, post } from './api.ts';
import { SessionProvider } from './lib.tsx';
import type { AppConfig, User } from './lib.tsx';
import { Button, ConfirmProvider, Skeleton, ToastProvider } from './components/ui.tsx';
import { Login } from './pages/Login.tsx';

// O painel administrativo e o app do entregador são carregados separadamente: o celular do entregador não baixa o painel.
const AdminApp = lazy(() => import('./pages/admin/AdminApp.tsx'));
const DriverApp = lazy(() => import('./pages/driver/DriverApp.tsx'));

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="login">
        <div className="card pad stack" style={{ maxWidth: 420 }} role="alert">
          <div className="row">
            <AlertCircle color="#DC2626" />
            <h1 className="h-section">Algo deu errado nesta tela</h1>
          </div>
          <p className="muted small">Seus dados salvos não foram afetados. Recarregue a página para continuar.</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }
}

function Loading() {
  return (
    <div style={{ padding: 24, maxWidth: 640, margin: '0 auto' }}>
      <Skeleton count={4} h={96} />
    </div>
  );
}

export function App() {
  const [state, setState] = useState<{ status: 'loading' | 'out' | 'in'; user?: User; config?: AppConfig }>({ status: 'loading' });

  const load = useCallback(async () => {
    try {
      const { user } = await api<{ user: User | null }>('/api/auth/me');
      if (!user) return setState({ status: 'out' });
      const config = await api<AppConfig>('/api/config');
      setState({ status: 'in', user, config });
    } catch {
      setState({ status: 'out' });
    }
  }, []);

  useEffect(() => {
    load();
    const out = () => setState({ status: 'out' });
    window.addEventListener('mercatto:unauthorized', out);
    return () => window.removeEventListener('mercatto:unauthorized', out);
  }, [load]);

  const logout = useCallback(async () => {
    await post('/api/auth/logout').catch(() => {});
    // Remove as listas de entregas salvas no aparelho (LGPD); mantém a escolha de versão.
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('mercatto:entregas'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
    setState({ status: 'out' });
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          {state.status === 'loading' ? (
            <Loading />
          ) : state.status === 'out' ? (
            <Login onLogin={load} />
          ) : (
            <SessionProvider value={{ user: state.user!, config: state.config!, logout }}>
              <Suspense fallback={<Loading />}>{state.user!.role === 'admin' ? <AdminApp /> : <DriverApp />}</Suspense>
            </SessionProvider>
          )}
        </ConfirmProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
