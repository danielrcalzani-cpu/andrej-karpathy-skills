import { useState } from 'react';
import { Car, Edit3, Phone, Plus, Truck, UserPlus, Users } from 'lucide-react';
import { formatPhone, maskPhoneInput } from '../../../shared/domain.ts';
import type { FieldErrors } from '../../../shared/domain.ts';
import { ApiError, api, post, put } from '../../api.ts';
import { IS_ARTIFACT } from '../../target.ts';
import { invalidateAll, navigate, useResource } from '../../lib.tsx';
import { Badge, Button, EmptyState, ErrorState, Field, Modal, Skeleton, useToast } from '../../components/ui.tsx';
import { PageHeader } from './AdminApp.tsx';

interface DriverRow {
  id: number;
  name: string;
  phone: string | null;
  active: boolean;
  vehicle_id: number | null;
  vehicle_name: string | null;
  vehicle_plate: string | null;
  day_count: number;
  open_count: number;
  username: string | null;
  user_id?: string | null;
}
interface Vehicle {
  id: number;
  name: string;
  plate: string | null;
  type: string | null;
  capacity_kg: number | null;
  active: boolean;
}

function useSaver() {
  const toast = useToast();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const save = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    setErrors({});
    try {
      await fn();
      toast(ok);
      invalidateAll();
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Erro ao salvar.', 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { errors, busy, save };
}

/** Versão claude.ai: escolhe a pessoa (conta claude.ai) que usará o app deste entregador. */
function PersonPicker({ value, label, onChange }: { value: string; label: string; onChange: (id: string, name: string) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<{ id: string; name: string }[]>([]);
  const [open, setOpen] = useState(false);
  const search = async (text: string) => {
    setQ(text);
    try {
      setHits((await api<{ people: { id: string; name: string }[] }>(`/api/people?q=${encodeURIComponent(text)}`)).people);
    } catch {
      setHits([]);
    }
  };
  return (
    <Field label="Pessoa no claude.ai" htmlFor="dr-person" hint="Quem vai usar o app Minhas Entregas com este cadastro. Compartilhe a página com ela como Colaborador.">
      {value ? (
        <div className="row between card pad" style={{ padding: '8px 12px' }}>
          <span className="small strong">{label || 'Pessoa vinculada'}</span>
          <Button size="sm" variant="ghost" onClick={() => onChange('', '')}>
            Desvincular
          </Button>
        </div>
      ) : (
        <div className="stack tight">
          <input
            id="dr-person"
            className="input"
            placeholder="Buscar pelo nome"
            autoComplete="off"
            value={q}
            onFocus={() => (setOpen(true), search(q))}
            onChange={(e) => search(e.target.value)}
          />
          {open && hits.length > 0 && (
            <div className="checklist">
              {hits.map((h) => (
                <button key={h.id} type="button" className="check-row" style={{ border: 0, textAlign: 'left', cursor: 'pointer' }} onClick={() => (onChange(h.id, h.name), setOpen(false))}>
                  {h.name}
                </button>
              ))}
            </div>
          )}
          {open && q && hits.length === 0 && <span className="tiny muted">Ninguém encontrado com esse nome na sua organização.</span>}
        </div>
      )}
    </Field>
  );
}

function DriverDialog({ driver, vehicles, onClose }: { driver: DriverRow | null; vehicles: Vehicle[]; onClose: () => void }) {
  const [v, setV] = useState({
    name: driver?.name ?? '',
    phone: driver?.phone ? formatPhone(driver.phone) : '',
    vehicle_id: driver?.vehicle_id ? String(driver.vehicle_id) : '',
    active: driver?.active ?? true,
    user_id: driver?.user_id ?? '',
  });
  const [personName, setPersonName] = useState(driver?.username ?? '');
  const { errors, busy, save } = useSaver();
  const submit = async () => {
    const ok = await save(() => (driver ? put(`/api/drivers/${driver.id}`, v) : post('/api/drivers', v)), driver ? 'Entregador atualizado.' : 'Entregador cadastrado.');
    if (ok) onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={driver ? 'Editar entregador' : 'Novo entregador'}
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
        <Field label="Nome *" htmlFor="dr-name" error={errors.name}>
          <input id="dr-name" className="input" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
        </Field>
        <Field label="Telefone" htmlFor="dr-phone" error={errors.phone}>
          <input id="dr-phone" className="input" type="tel" inputMode="tel" value={v.phone} onChange={(e) => setV({ ...v, phone: maskPhoneInput(e.target.value) })} />
        </Field>
        <Field label="Veículo (opcional)" htmlFor="dr-vehicle">
          <select id="dr-vehicle" className="select" value={v.vehicle_id} onChange={(e) => setV({ ...v, vehicle_id: e.target.value })}>
            <option value="">Nenhum</option>
            {vehicles
              .filter((x) => x.active || String(x.id) === v.vehicle_id)
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name}
                  {x.plate ? ` — ${x.plate}` : ''}
                </option>
              ))}
          </select>
        </Field>
        {IS_ARTIFACT && (
          <PersonPicker
            value={v.user_id}
            label={personName}
            onChange={(id, name) => {
              setV({ ...v, user_id: id });
              setPersonName(name);
            }}
          />
        )}
        <label className="check">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
          Ativo (pode receber entregas)
        </label>
        {driver && !v.active && <p className="small muted">Ao desativar, o acesso do entregador ao app também é bloqueado. As entregas já atribuídas continuam no histórico.</p>}
      </div>
    </Modal>
  );
}

function VehicleDialog({ vehicle, onClose }: { vehicle: Vehicle | null; onClose: () => void }) {
  const [v, setV] = useState({
    name: vehicle?.name ?? '',
    plate: vehicle?.plate ?? '',
    type: vehicle?.type ?? '',
    capacity_kg: vehicle?.capacity_kg == null ? '' : String(vehicle.capacity_kg),
    active: vehicle?.active ?? true,
  });
  const { errors, busy, save } = useSaver();
  const submit = async () => {
    const ok = await save(() => (vehicle ? put(`/api/vehicles/${vehicle.id}`, v) : post('/api/vehicles', v)), 'Veículo salvo.');
    if (ok) onClose();
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={vehicle ? 'Editar veículo' : 'Novo veículo'}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={busy} onClick={submit}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <Field className="span-6" label="Nome *" htmlFor="vh-name" error={errors.name}>
          <input id="vh-name" className="input" placeholder="Ex.: Caminhão baú" value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} autoFocus />
        </Field>
        <Field className="span-3" label="Placa" htmlFor="vh-plate">
          <input id="vh-plate" className="input" style={{ textTransform: 'uppercase' }} value={v.plate} onChange={(e) => setV({ ...v, plate: e.target.value })} />
        </Field>
        <Field className="span-3" label="Tipo" htmlFor="vh-type">
          <input id="vh-type" className="input" placeholder="Ex.: Furgão" value={v.type} onChange={(e) => setV({ ...v, type: e.target.value })} />
        </Field>
        <Field className="span-3" label="Capacidade (kg)" htmlFor="vh-cap" error={errors.capacity_kg}>
          <input id="vh-cap" className="input" inputMode="decimal" value={v.capacity_kg} onChange={(e) => setV({ ...v, capacity_kg: e.target.value })} />
        </Field>
        <label className="check span-6">
          <input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} />
          Em uso
        </label>
      </div>
    </Modal>
  );
}

export function Drivers() {
  const drivers = useResource<{ drivers: DriverRow[] }>('/api/drivers');
  const vehicles = useResource<{ vehicles: Vehicle[] }>('/api/vehicles');
  const [editDriver, setEditDriver] = useState<DriverRow | null | 'new'>(null);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null | 'new'>(null);
  const vlist = vehicles.data?.vehicles ?? [];
  return (
    <div className="stack loose">
      <PageHeader title="Entregadores" subtitle="Carga de hoje e entregas em aberto de cada entregador.">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEditDriver('new')}>
          Novo entregador
        </Button>
      </PageHeader>
      {drivers.error && !drivers.data ? (
        <ErrorState error={drivers.error} onRetry={drivers.reload} />
      ) : !drivers.data ? (
        <Skeleton count={2} h={80} />
      ) : drivers.data.drivers.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Users size={22} />} title="Nenhum entregador cadastrado." action={<Button onClick={() => setEditDriver('new')}>Cadastrar entregador</Button>} />
        </div>
      ) : (
        <div className="card-grid">
          {drivers.data.drivers.map((d) => (
            <article key={d.id} className="card pad stack" style={{ opacity: d.active ? 1 : 0.65 }}>
              <div className="row between">
                <div className="row">
                  <span className="avatar" aria-hidden>
                    {d.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <div className="strong">{d.name}</div>
                    <div className="tiny muted">{d.username ? `${IS_ARTIFACT ? 'Pessoa' : 'Acesso'}: ${d.username}` : 'Sem acesso ao app'}</div>
                  </div>
                </div>
                {d.active ? <Badge tone="success">Ativo</Badge> : <Badge>Inativo</Badge>}
              </div>
              <div className="meta">
                {d.phone && (
                  <span>
                    <Phone size={13} /> {formatPhone(d.phone)}
                  </span>
                )}
                {d.vehicle_name && (
                  <span>
                    <Truck size={13} /> {d.vehicle_name}
                    {d.vehicle_plate ? ` (${d.vehicle_plate})` : ''}
                  </span>
                )}
              </div>
              <div className="row" style={{ gap: 16 }}>
                <div>
                  <div className="h-page mono">{d.day_count}</div>
                  <div className="tiny muted">hoje</div>
                </div>
                <div>
                  <div className="h-page mono">{d.open_count}</div>
                  <div className="tiny muted">em aberto</div>
                </div>
              </div>
              <div className="row wrap">
                <Button size="sm" icon={<Edit3 size={14} />} onClick={() => setEditDriver(d)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate('/agenda', { view: 'list', driver: String(d.id) })}>
                  Ver entregas
                </Button>
                {!IS_ARTIFACT && !d.username && d.active && (
                  <Button size="sm" variant="ghost" icon={<UserPlus size={14} />} onClick={() => navigate('/configuracoes', { novo_entregador: String(d.id) })}>
                    Criar acesso
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <PageHeader title="Veículos" subtitle="Opcional — cadastre se quiser vincular veículos aos entregadores.">
        <Button icon={<Car size={16} />} onClick={() => setEditVehicle('new')}>
          Novo veículo
        </Button>
      </PageHeader>
      {vlist.length === 0 ? (
        <p className="small muted">Nenhum veículo cadastrado.</p>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table className="table responsive">
              <thead>
                <tr>
                  <th>Veículo</th>
                  <th>Placa</th>
                  <th>Tipo</th>
                  <th>Capacidade</th>
                  <th>Situação</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {vlist.map((v) => (
                  <tr key={v.id}>
                    <td className="strong cell-title">{v.name}</td>
                    <td data-label="Placa">{v.plate ?? '—'}</td>
                    <td data-label="Tipo">{v.type ?? '—'}</td>
                    <td data-label="Capacidade">{v.capacity_kg != null ? `${v.capacity_kg.toLocaleString('pt-BR')} kg` : '—'}</td>
                    <td data-label="Situação">{v.active ? <Badge tone="success">Em uso</Badge> : <Badge>Fora de uso</Badge>}</td>
                    <td className="cell-action">
                      <Button size="sm" variant="ghost" onClick={() => setEditVehicle(v)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {editDriver && <DriverDialog driver={editDriver === 'new' ? null : editDriver} vehicles={vlist} onClose={() => setEditDriver(null)} />}
      {editVehicle && <VehicleDialog vehicle={editVehicle === 'new' ? null : editVehicle} onClose={() => setEditVehicle(null)} />}
    </div>
  );
}
