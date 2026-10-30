import { useState } from 'react';
import type { FormEvent } from 'react';
import { Lock, LogIn, Monitor, Smartphone, User } from 'lucide-react';
import { currentUI, switchUI } from '../ui.ts';
import { post } from '../api.ts';
import { Button, Field } from '../components/ui.tsx';

export function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/api/auth/login', { username, password });
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login">
      <div className="stack loose" style={{ width: 'min(400px, 100%)' }}>
        <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
          <div className="brand-mark" style={{ background: 'var(--brand)', width: 44, height: 44 }}>
            M
          </div>
          <div>
            <div className="h-page" style={{ fontSize: 20 }}>
              Mercatto Decor
            </div>
            <div className="small muted">Gestão de entregas</div>
          </div>
        </div>
        <form className="card pad stack loose" style={{ padding: 24 }} onSubmit={submit}>
          <div>
            <h1 className="h-section" style={{ fontSize: 18 }}>
              Entrar
            </h1>
            <p className="small muted">Use o usuário e a senha fornecidos pelo escritório.</p>
          </div>
          <Field label="Usuário" htmlFor="login-user">
            <div className="input-icon">
              <User size={16} />
              <input
                id="login-user"
                className="input"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </Field>
          <Field label="Senha" htmlFor="login-pass">
            <div className="input-icon">
              <Lock size={16} />
              <input id="login-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </Field>
          {error && (
            <div className="banner tone-danger small" role="alert">
              {error}
            </div>
          )}
          <Button type="submit" variant="primary" size="lg" block loading={busy} icon={<LogIn size={18} />}>
            Entrar
          </Button>
        </form>
        <button type="button" className="btn ghost sm" style={{ alignSelf: 'center' }} onClick={() => switchUI(currentUI() === 'pc' ? 'mobile' : 'pc')}>
          {currentUI() === 'pc' ? <Smartphone size={15} /> : <Monitor size={15} />}
          {currentUI() === 'pc' ? 'Usar versão para celular' : 'Usar versão para computador'}
        </button>
      </div>
    </main>
  );
}
