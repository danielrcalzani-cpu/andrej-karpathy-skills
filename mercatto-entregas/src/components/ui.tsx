import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Flame, Loader2, RefreshCw, X } from 'lucide-react';
import { STATUS_META, urgencyMeta } from '../../shared/domain.ts';
import type { Status, Tone } from '../../shared/domain.ts';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent' | 'success' | 'danger' | 'danger-outline' | 'ghost' | 'default';
  size?: 'sm' | 'lg';
  block?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  iconOnly?: boolean;
};
export function Button({ variant = 'default', size, block, icon, loading, iconOnly, className, children, disabled, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      className={cx('btn', variant !== 'default' && variant, size, block && 'block', iconOnly && 'icon', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

export function Badge({ tone = 'neutral', children, dot, icon }: { tone?: Tone; children: ReactNode; dot?: boolean; icon?: ReactNode }) {
  return (
    <span className={cx('badge', `tone-${tone}`)}>
      {dot && <span className="dot" aria-hidden />}
      {icon}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <Badge tone={m.tone} dot>
      {m.label}
    </Badge>
  );
}

/** Urgência sempre com ícone + texto (não depende só de cor). */
export function UrgencyBadge({ urgency }: { urgency: string | null }) {
  const m = urgencyMeta(urgency);
  if (!m) return null;
  return (
    <Badge tone={m.tone} icon={m.value === 'alta' ? <Flame size={12} aria-hidden /> : <AlertTriangle size={12} aria-hidden />}>
      {m.label}
    </Badge>
  );
}

export function Field({
  label,
  error,
  hint,
  children,
  className,
  htmlFor,
}: {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={cx('field', className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <span className="error" role="alert">
          <AlertCircle size={13} aria-hidden /> {error}
        </span>
      ) : (
        hint && <span className="hint">{hint}</span>
      )}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  label: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: 'wide' | 'drawer' | 'full' | 'drawer full' | 'wide full';
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={cx('modal', variant)}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {open && (
        <>
          <div className="modal-head">
            {icon}
            <div className="grow">
              <h2 id={titleId} className="h-section" style={{ fontSize: 17 }}>
                {title}
              </h2>
              {subtitle && <div className="small muted">{subtitle}</div>}
            </div>
            <Button variant="ghost" iconOnly onClick={onClose} aria-label="Fechar" icon={<X size={18} />} />
          </div>
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-foot">{footer}</div>}
        </>
      )}
    </dialog>
  );
}

export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="empty-icon" aria-hidden>
        {icon}
      </div>
      <h3>{title}</h3>
      {children && <p className="small">{children}</p>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="banner tone-danger" role="alert">
      <AlertCircle size={18} />
      <div className="grow">
        <div className="strong">Não foi possível carregar.</div>
        <div className="small">{error.message}</div>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry} icon={<RefreshCw size={14} />}>
          Tentar de novo
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ h = 120, count = 3 }: { h?: number; count?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton" style={{ height: h }} />
      ))}
    </div>
  );
}

export function ProgressBar({ value, max, tone }: { value: number; max: number; tone?: 'warning' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={cx('progress', tone)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toasts

interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error';
}
const ToastCtx = createContext<(text: string, kind?: 'ok' | 'error') => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((text: string, kind: 'ok' | 'error' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-2), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'error' ? 6000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={cx('toast', t.kind === 'error' && 'error')}>
            {t.kind === 'ok' ? <CheckCircle2 size={18} color="#86efac" /> : <AlertCircle size={18} color="#fecaca" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Confirmação (com motivo opcional)

interface ConfirmOpts {
  title: string;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  reason?: { label: string; required?: boolean; placeholder?: string };
}
type ConfirmFn = (o: ConfirmOpts) => Promise<{ reason: string } | null>;
const ConfirmCtx = createContext<ConfirmFn>(async () => null);
export const useConfirm = () => useContext(ConfirmCtx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (v: { reason: string } | null) => void }) | null>(null);
  const [reason, setReason] = useState('');
  const confirm = useCallback<ConfirmFn>(
    (o) =>
      new Promise((resolve) => {
        setReason('');
        setState({ ...o, resolve });
      }),
    [],
  );
  const close = (v: { reason: string } | null) => {
    state?.resolve(v);
    setState(null);
  };
  const needReason = state?.reason?.required && reason.trim().length < 3;
  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(null)}
        title={state?.title ?? ''}
        footer={
          <>
            <Button onClick={() => close(null)}>Voltar</Button>
            <Button variant={state?.danger ? 'danger' : 'primary'} disabled={!!needReason} onClick={() => close({ reason: reason.trim() })}>
              {state?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <div className="stack">
          {state?.message && <div className="muted">{state.message}</div>}
          {state?.reason && (
            <Field label={state.reason.label} htmlFor="confirm-reason" hint={state.reason.required ? 'Obrigatório — fica registrado no histórico.' : undefined}>
              <textarea
                id="confirm-reason"
                className="textarea"
                value={reason}
                placeholder={state.reason.placeholder}
                onChange={(e) => setReason(e.target.value)}
                autoFocus
              />
            </Field>
          )}
        </div>
      </Modal>
    </ConfirmCtx.Provider>
  );
}
