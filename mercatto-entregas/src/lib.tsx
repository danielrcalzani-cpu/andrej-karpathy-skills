import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { api } from './api.ts';
import { IS_ARTIFACT } from './target.ts';

// ---------------------------------------------------------------------------
// Roteamento por hash (#/agenda?view=list)

function readHash() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = raw.split('?');
  return { path: path || '/', params: new URLSearchParams(query) };
}
let hashSnapshot = window.location.hash;
const subscribeHash = (cb: () => void) => {
  const h = () => {
    hashSnapshot = window.location.hash;
    cb();
  };
  window.addEventListener('hashchange', h);
  return () => window.removeEventListener('hashchange', h);
};

// Na versão claude.ai o endereço só aceita "#nome" (usado para escolher a versão), então as telas
// internas ficam num roteador em memória.
let memRoute = '/';
let memVersion = 0;
const memListeners = new Set<() => void>();
const subscribeMem = (cb: () => void) => {
  memListeners.add(cb);
  return () => memListeners.delete(cb);
};

function readRoute() {
  if (!IS_ARTIFACT) return readHash();
  const [path, query = ''] = memRoute.split('?');
  return { path: path || '/', params: new URLSearchParams(query) };
}

export function useRoute() {
  useSyncExternalStore<string | number>(IS_ARTIFACT ? subscribeMem : subscribeHash, IS_ARTIFACT ? () => memVersion : () => hashSnapshot);
  return readRoute();
}

export function navigate(path: string, params?: Record<string, string | undefined | null>) {
  const q = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([k, v]) => v != null && v !== '' && q.set(k, v));
  const s = q.toString();
  if (IS_ARTIFACT) {
    memRoute = path + (s ? `?${s}` : '');
    memVersion++;
    memListeners.forEach((l) => l());
    window.scrollTo(0, 0);
    return;
  }
  window.location.hash = path + (s ? `?${s}` : '');
}

export function goBack() {
  if (!IS_ARTIFACT && window.history.length > 1) window.history.back();
  else navigate('/');
}

// ---------------------------------------------------------------------------
// Sincronização: invalidação global + atualização periódica (sem tempo real)

const listeners = new Set<() => void>();
export function invalidateAll() {
  listeners.forEach((l) => l());
}
export const REFRESH_MS = 30_000;

interface Resource<T> {
  data: T | undefined;
  error: Error | null;
  loading: boolean;
  reload: () => void;
  lastUpdated: number | null;
}

/**
 * Busca dados e mantém atualizados: recarrega ao invalidar, ao voltar para a aba e a cada 30 s.
 * Mantém os dados anteriores na tela enquanto recarrega (sem piscar).
 */
export function useResource<T>(url: string | null, opts: { poll?: boolean } = {}): Resource<T> {
  const [state, setState] = useState<{ data?: T; error: Error | null; loading: boolean; lastUpdated: number | null }>({
    error: null,
    loading: !!url,
    lastUpdated: null,
  });
  const seq = useRef(0);
  const urlRef = useRef(url);
  urlRef.current = url;

  const load = useCallback(() => {
    const u = urlRef.current;
    if (!u) return;
    const my = ++seq.current;
    setState((s) => ({ ...s, loading: true }));
    api<T>(u)
      .then((data) => my === seq.current && setState({ data, error: null, loading: false, lastUpdated: Date.now() }))
      .catch((error) => my === seq.current && setState((s) => ({ ...s, error, loading: false })));
  }, []);

  useEffect(() => {
    setState((s) => ({ ...s, data: undefined }));
    load();
  }, [url, load]);

  useEffect(() => {
    listeners.add(load);
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', load);
    const timer = opts.poll === false ? null : window.setInterval(() => document.visibilityState === 'visible' && load(), REFRESH_MS);
    return () => {
      listeners.delete(load);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', load);
      if (timer) clearInterval(timer);
    };
  }, [load, opts.poll]);

  return { data: state.data, error: state.error, loading: state.loading, reload: load, lastUpdated: state.lastUpdated };
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function useOnline() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,
  );
}

// ---------------------------------------------------------------------------
// Sessão e configuração

export interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'driver';
  driver_id: number | null;
}
export interface AppConfig {
  today: string;
  timezone: string;
  default_city: string;
  default_state: string;
  route_optimization: boolean;
  max_photo_mb: number;
}

interface Session {
  user: User;
  config: AppConfig;
  logout: () => void;
}
const SessionCtx = createContext<Session | null>(null);
export const SessionProvider = ({ value, children }: { value: Session; children: ReactNode }) => (
  <SessionCtx.Provider value={value}>{children}</SessionCtx.Provider>
);
export function useSession(): Session {
  const s = useContext(SessionCtx);
  if (!s) throw new Error('Sessão ausente');
  return s;
}

/** Armazenamento local tolerante a falhas (modo privado, cota cheia). */
export const safeStorage = {
  get<T>(key: string): T | null {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* sem armazenamento disponível */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function newRequestId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
