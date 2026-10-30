import { useEffect, useState } from 'react';
import { Download, KeyRound, Plug, Upload, UserPlus } from 'lucide-react';
import type { FieldErrors } from '../../../shared/domain.ts';
import { ApiError, post, put } from '../../api.ts';
import { invalidateAll, useResource, useRoute, useSession } from '../../lib.tsx';
import { Badge, Button, Field, Modal, Skeleton, useConfirm, useToast } from '../../components/ui.tsx';
import { PageHeader } from './AdminApp.tsx';

interface UserRow {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'driver';
  driver_id: number | null;
  driver_name: string | null;
  active: boolean;
}

function GeneralSettings() {
  const res = useResource<Record<string, string>>('/api/settings', { poll: false });
  const [v, setV] = useState<Record<string, string> | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => {
    if (res.data && !v) setV(res.data);
  }, [res.data, v]);
  if (!v) return <Skeleton count={1} h={140} />;
  const save = async () => {
    setBusy(true);
    try {
      await put('/api/settings', v);
      toast('Configurações salvas. Recarregue a página para aplicar a cidade padrão nos formulários.');
      setErrors({});
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Erro ao salvar.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="h-section">Endereço padrão</h3>
      </div>
      <div className="card-body stack">
        <p className="small muted">Usado para preencher novos cadastros e completar endereços antigos (texto livre) na navegação pelo Maps/Waze.</p>
        <div className="form-grid">
          <Field className="span-4" label="Cidade" htmlFor="st-city">
            <input id="st-city" className="input" value={v.default_city} onChange={(e) => setV({ ...v, default_city: e.target.value })} placeholder="Ex.: Manaus" />
          </Field>
          <Field className="span-2" label="Estado" htmlFor="st-uf" error={errors.default_state}>
            <input id="st-uf" className="input" maxLength={2} style={{ textTransform: 'uppercase' }} value={v.default_state} onChange={(e) => setV({ ...v, default_state: e.target.value })} placeholder="AM" />
          </Field>
        </div>
        <div>
          <Button variant="primary" loading={busy} onClick={save}>
            Salvar
          </Button>
        </div>
      </div>
    </section>
  );
}

function UserDialog({ user, presetDriver, onClose }: { user: UserRow | null; presetDriver: string | null; onClose: () => void }) {
  const drivers = useResource<{ drivers: { id: number; name: string; active: boolean; username: string | null }[] }>('/api/drivers', { poll: false });
  const preset = drivers.data?.drivers.find((d) => String(d.id) === presetDriver);
  const [v, setV] = useState({ name: user?.name ?? '', username: user?.username ?? '', password: '', role: user?.role ?? (presetDriver ? 'driver' : 'admin'), driver_id: presetDriver ?? '', active: user?.active ?? true });
  useEffect(() => {
    if (preset && !v.name) setV((x) => ({ ...x, name: preset.name, username: preset.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '').slice(0, 20) }));
  }, [preset, v.name]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async () => {
    setBusy(true);
    try {
      if (user) await put(`/api/users/${user.id}`, { name: v.name, active: v.active, password: v.password || undefined });
      else await post('/api/users', v);
      toast(user ? 'Usuário atualizado.' : 'Acesso criado. Envie o usuário e a senha ao colaborador por um canal seguro.');
      invalidateAll();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Erro ao salvar.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={user ? `Editar acesso — ${user.username}` : 'Novo acesso'}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={busy} onClick={submit}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Nome" htmlFor="us-name" error={errors.name}>
          <input id="us-name" className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} />
        </Field>
        {!user && (
          <>
            <Field label="Usuário (login)" htmlFor="us-user" error={errors.username}>
              <input id="us-user" className="input" autoCapitalize="none" value={v.username} onChange={(e) => setV({ ...v, username: e.target.value.toLowerCase() })} />
            </Field>
            <Field label="Perfil" htmlFor="us-role" error={errors.role}>
              <select id="us-role" className="select" value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as 'admin' | 'driver' })}>
                <option value="admin">Administrador (escritório)</option>
                <option value="driver">Entregador (app Minhas Entregas)</option>
              </select>
            </Field>
            {v.role === 'driver' && (
              <Field label="Entregador vinculado" htmlFor="us-driver" error={errors.driver_id}>
                <select id="us-driver" className="select" value={v.driver_id} onChange={(e) => setV({ ...v, driver_id: e.target.value })}>
                  <option value="">Escolha…</option>
                  {drivers.data?.drivers
                    .filter((d) => d.active)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                        {d.username ? ` (já tem acesso: ${d.username})` : ''}
                      </option>
                    ))}
                </select>
              </Field>
            )}
          </>
        )}
        <Field label={user ? 'Nova senha (deixe em branco para manter)' : 'Senha'} htmlFor="us-pass" error={errors.password} hint="Mínimo de 8 caracteres.">
          <input id="us-pass" className="input" type="password" autoComplete="new-password" value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} />
        </Field>
        {user && (
          <label className="check">
            <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
            Acesso ativo
          </label>
        )}
      </div>
    </Modal>
  );
}

function UsersSection() {
  const route = useRoute();
  const preset = route.params.get('novo_entregador');
  const res = useResource<{ users: UserRow[] }>('/api/users');
  const [edit, setEdit] = useState<UserRow | null | 'new'>(preset ? 'new' : null);
  const { user: me } = useSession();
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="h-section">Usuários e acessos</h3>
        <Button size="sm" icon={<UserPlus size={15} />} onClick={() => setEdit('new')}>
          Novo acesso
        </Button>
      </div>
      {!res.data ? (
        <div className="card-body">
          <Skeleton count={2} h={40} />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table responsive">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {res.data.users.map((u) => (
                <tr key={u.id}>
                  <td className="strong cell-title">
                    {u.name} {u.id === me.id && <span className="tiny muted">(você)</span>}
                  </td>
                  <td data-label="Usuário">{u.username}</td>
                  <td data-label="Perfil">{u.role === 'admin' ? 'Administrador' : `Entregador${u.driver_name ? ` — ${u.driver_name}` : ''}`}</td>
                  <td data-label="Situação">{u.active ? <Badge tone="success">Ativo</Badge> : <Badge>Bloqueado</Badge>}</td>
                  <td className="cell-action">
                    <Button size="sm" variant="ghost" icon={<KeyRound size={14} />} onClick={() => setEdit(u)}>
                      Editar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {edit && <UserDialog user={edit === 'new' ? null : edit} presetDriver={edit === 'new' ? preset : null} onClose={() => setEdit(null)} />}
    </section>
  );
}

function ImportSection() {
  const toast = useToast();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped_duplicates: number; failed: { index: number; reason: string }[]; warnings: string[] } | null>(null);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    let data: unknown;
    try {
      data = JSON.parse(await file.text());
    } catch {
      toast('O arquivo não é um JSON válido.', 'error');
      return;
    }
    const ok = await confirm({
      title: 'Importar registros da agenda antiga?',
      message: 'Os registros são adicionados sem apagar nada. Registros já importados antes são ignorados. O conteúdo original de cada registro fica guardado.',
      confirmLabel: 'Importar',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await post('/api/import/legacy', { data });
      setResult(r);
      invalidateAll();
      toast(`${r.imported} entrega(s) importada(s).`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Falha na importação.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="card">
      <div className="card-head">
        <h3 className="h-section">Dados</h3>
      </div>
      <div className="card-body stack">
        <div className="row wrap">
          <label className="btn" aria-disabled={busy}>
            <Upload size={16} /> Importar agenda antiga (JSON)
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ''))} disabled={busy} />
          </label>
          <a className="btn" href="/api/export" download>
            <Download size={16} /> Baixar cópia de segurança
          </a>
        </div>
        <p className="tiny muted">
          A importação reconhece os campos Cliente, Vendedor, WhatsApp de quem recebe, Nº do pedido ou nota, Endereço de entrega, Materiais a entregar, Data da entrega,
          Período, Entregador ou motorista, Material separado?, Situação, Urgência e Observações. A cópia de segurança contém dados pessoais de clientes — guarde em local
          protegido.
        </p>
        {result && (
          <div className="banner tone-info small">
            <div className="stack tight">
              <b>
                {result.imported} importada(s) · {result.skipped_duplicates} já existiam · {result.failed.length} com erro
              </b>
              {[...result.failed.map((f) => `Registro ${f.index + 1}: ${f.reason}`), ...result.warnings].slice(0, 20).map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export function SettingsPage() {
  return (
    <div className="stack loose" style={{ maxWidth: 860 }}>
      <PageHeader title="Configurações" />
      <GeneralSettings />
      <UsersSection />
      <ImportSection />
      <section className="card">
        <div className="card-head">
          <h3 className="h-section row">
            <Plug size={16} /> Integrações
          </h3>
        </div>
        <div className="card-body stack small">
          <div className="row between wrap">
            <span>Busca de endereço por CEP (ViaCEP, gratuito)</span>
            <Badge tone="success">Ativa</Badge>
          </div>
          <div className="row between wrap">
            <span>Google Maps e Waze (links de navegação)</span>
            <Badge tone="success">Ativa</Badge>
          </div>
          <div className="row between wrap">
            <span>WhatsApp (links click-to-chat; o envio é feito pela pessoa no WhatsApp)</span>
            <Badge tone="success">Ativa</Badge>
          </div>
          <div className="row between wrap">
            <span>Otimização automática de rotas</span>
            <Badge>Não configurada</Badge>
          </div>
          <div className="row between wrap">
            <span>Atualização entre aparelhos</span>
            <Badge tone="info">A cada 30 s e ao abrir o app</Badge>
          </div>
        </div>
      </section>
    </div>
  );
}
