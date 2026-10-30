import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { AlertTriangle, ClipboardList, Flame, Loader2, MapPin, Package, Plus, Trash2, User } from 'lucide-react';
import { UNITS, URGENCIES, formatDateBR, formatDateTime, formatPhone, maskPhoneInput, STATUS_META, validateDelivery } from '../../shared/domain.ts';
import type { Delivery, FieldErrors, Status } from '../../shared/domain.ts';
import { ApiError, api, post, put } from '../api.ts';
import { invalidateAll, newRequestId, useSession } from '../lib.tsx';
import { Button, Field, Modal, Segmented, cx, useConfirm, useToast } from './ui.tsx';
import { ScheduleFields, scheduleState } from './actions.tsx';

interface ItemDraft {
  key: string;
  id?: number;
  description: string;
  quantity: string;
  unit: string;
  package_count: string;
  weight_kg: string;
  prepared: boolean;
  checked: boolean;
  loaded: boolean;
}

function toDraft(d: Delivery | null, defaults: { city: string; state: string }) {
  return {
    customer_name: d?.customer_name ?? '',
    receiver_whatsapp: d?.receiver_whatsapp ? formatPhone(d.receiver_whatsapp) : '',
    salesperson: d?.salesperson ?? '',
    order_number: d?.order_number ?? '',
    postal_code: d?.postal_code ?? '',
    street: d?.street ?? '',
    address_number: d?.address_number ?? '',
    address_complement: d?.address_complement ?? '',
    neighborhood: d?.neighborhood ?? '',
    city: d ? d.city ?? '' : defaults.city,
    state: d ? d.state ?? '' : defaults.state,
    reference_point: d?.reference_point ?? '',
    address_text: d?.address_text ?? '',
    materials_notes: d?.materials_notes ?? '',
    ...scheduleState(d),
    urgency: d?.urgency ?? '',
    material_separated: d?.material_separated ?? false,
    driver_notes: d?.driver_notes ?? '',
    internal_notes: d?.internal_notes ?? '',
    items: (d?.items ?? []).map<ItemDraft>((i) => ({
      key: String(i.id),
      id: i.id,
      description: i.description,
      quantity: String(i.quantity),
      unit: i.unit,
      package_count: i.package_count == null ? '' : String(i.package_count),
      weight_kg: i.weight_kg == null ? '' : String(i.weight_kg),
      prepared: i.prepared,
      checked: i.checked,
      loaded: i.loaded,
    })),
  };
}
type Draft = ReturnType<typeof toDraft>;

const emptyItem = (): ItemDraft => ({
  key: newRequestId(),
  description: '',
  quantity: '',
  unit: 'caixas',
  package_count: '',
  weight_kg: '',
  prepared: false,
  checked: false,
  loaded: false,
});

function Section({ icon, title, children, aside }: { icon: ReactNode; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="stack">
      <div className="row between">
        <div className="row">
          <span className="stat-icon tone-accent" style={{ width: 28, height: 28, borderRadius: 8, display: 'grid', placeItems: 'center' }} aria-hidden>
            {icon}
          </span>
          <h3 className="h-section">{title}</h3>
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function DeliveryForm({ delivery, open, onClose, onSaved }: { delivery: Delivery | null; open: boolean; onClose: () => void; onSaved: (id: number) => void }) {
  const { config } = useSession();
  const toast = useToast();
  const confirm = useConfirm();
  const defaults = { city: config.default_city, state: config.default_state };
  const [draft, setDraft] = useState<Draft>(() => toDraft(delivery, defaults));
  const initial = useRef(JSON.stringify(draft));
  const requestId = useRef(newRequestId());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [cep, setCep] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const [dups, setDups] = useState<{ id: number; customer_name: string; delivery_date: string | null; status: Status }[]>([]);
  const [freeAddress, setFreeAddress] = useState(!!delivery?.address_text && !delivery.street);

  useEffect(() => {
    if (!open) return;
    const d = toDraft(delivery, defaults);
    setDraft(d);
    initial.current = JSON.stringify(d);
    requestId.current = newRequestId();
    setErrors({});
    setDups([]);
    setFreeAddress(!!delivery?.address_text && !delivery.street);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, delivery?.id]);

  const dirty = open && JSON.stringify(draft) !== initial.current;
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const setItem = (key: string, patch: Partial<ItemDraft>) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) }));

  const close = async () => {
    if (dirty && !(await confirm({ title: 'Descartar alterações?', message: 'As informações digitadas ainda não foram salvas.', confirmLabel: 'Descartar', danger: true }))) return;
    onClose();
  };

  const lookupCep = async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCep({ loading: true });
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) throw new Error('CEP não encontrado. Preencha o endereço manualmente.');
      setDraft((d) => ({
        ...d,
        street: data.logradouro || d.street,
        neighborhood: data.bairro || d.neighborhood,
        city: data.localidade || d.city,
        state: data.uf || d.state,
      }));
      setCep({ loading: false });
    } catch (e) {
      setCep({ loading: false, error: e instanceof Error && e.message.startsWith('CEP') ? e.message : 'Não foi possível consultar o CEP agora. Preencha manualmente.' });
    }
  };

  const checkOrder = async () => {
    const n = draft.order_number.trim();
    if (!n) return setDups([]);
    try {
      const r = await api<{ matches: typeof dups }>(`/api/deliveries/check-order?order=${encodeURIComponent(n)}${delivery ? `&exclude=${delivery.id}` : ''}`);
      setDups(r.matches);
    } catch {
      /* verificação é apenas um aviso */
    }
  };

  const payload = useMemo(() => ({ ...draft, items: draft.items.map(({ key: _k, ...i }) => i) }), [draft]);

  const save = async () => {
    const { errors: errs } = validateDelivery(payload);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast('Revise os campos destacados.', 'error');
      return;
    }
    setSaving(true);
    try {
      const r = delivery
        ? await put<{ delivery: Delivery }>(`/api/deliveries/${delivery.id}`, { ...payload, version: delivery.version })
        : await post<{ delivery: Delivery }>('/api/deliveries', payload, { 'Idempotency-Key': requestId.current });
      initial.current = JSON.stringify(draft);
      toast(delivery ? 'Alterações salvas.' : `Entrega criada — ${STATUS_META[r.delivery.status].label}.`);
      invalidateAll();
      onSaved(r.delivery.id);
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Não foi possível salvar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const e = errors;
  const input = (k: keyof Draft, label: string, props: Record<string, unknown> = {}, cls = 'span-3', hint?: ReactNode) => (
    <Field className={cls} label={label} htmlFor={`f-${k}`} error={e[k]} hint={hint}>
      <input
        id={`f-${k}`}
        className="input"
        value={draft[k] as string}
        aria-invalid={!!e[k]}
        onChange={(ev) => set({ [k]: ev.target.value } as Partial<Draft>)}
        {...props}
      />
    </Field>
  );

  return (
    <Modal
      open={open}
      onClose={close}
      title={delivery ? 'Editar entrega' : 'Nova entrega'}
      subtitle={delivery ? `Atualizada em ${formatDateTime(delivery.updated_at)}` : 'Só o nome do cliente e o endereço são obrigatórios. O resto pode ser completado depois.'}
      variant="wide full"
      footer={
        <>
          <Button onClick={close} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={save}>
            {delivery ? 'Salvar alterações' : 'Criar entrega'}
          </Button>
        </>
      }
    >
      <form
        className="stack loose"
        onSubmit={(ev) => {
          ev.preventDefault();
          save();
        }}
        noValidate
      >
        <Section icon={<User size={15} />} title="Cliente">
          <div className="form-grid">
            {input('customer_name', 'Nome do cliente *', { autoComplete: 'off', autoFocus: !delivery }, 'span-6')}
            {input(
              'receiver_whatsapp',
              'WhatsApp de quem recebe',
              { type: 'tel', inputMode: 'tel', placeholder: '(92) 99123-4567', onChange: (ev: ChangeEvent<HTMLInputElement>) => set({ receiver_whatsapp: maskPhoneInput(ev.target.value) }) },
              'span-3',
            )}
            {input('salesperson', 'Vendedor responsável')}
            {input('order_number', 'Nº do pedido ou nota', { onBlur: checkOrder, autoComplete: 'off' }, 'span-3')}
            {dups.length > 0 && (
              <div className="span-6 banner tone-warning small" role="status">
                <AlertTriangle size={16} />
                <div>
                  Já existe entrega com este número:{' '}
                  {dups.map((d) => `${d.customer_name} (${d.delivery_date ? formatDateBR(d.delivery_date) : 'sem data'} · ${STATUS_META[d.status].label})`).join('; ')}. Você pode salvar mesmo
                  assim se for uma entrega diferente (ex.: entrega parcial).
                </div>
              </div>
            )}
          </div>
        </Section>

        <Section
          icon={<MapPin size={15} />}
          title="Endereço de entrega"
          aside={
            <Button size="sm" variant="ghost" onClick={() => setFreeAddress((v) => !v)}>
              {freeAddress ? 'Preencher por campos' : 'Texto livre'}
            </Button>
          }
        >
          {freeAddress ? (
            <div className="form-grid">
              <Field className="span-6" label="Endereço completo" htmlFor="f-address_text" error={e.street} hint="Inclua rua, número, bairro e cidade para a navegação funcionar.">
                <textarea id="f-address_text" className="textarea" value={draft.address_text} onChange={(ev) => set({ address_text: ev.target.value })} />
              </Field>
              {input('reference_point', 'Ponto de referência', {}, 'span-6')}
            </div>
          ) : (
            <div className="form-grid">
              <Field className="span-2" label="CEP" htmlFor="f-postal_code" error={e.postal_code ?? cep.error}>
                <div className="input-icon">
                  {cep.loading && <Loader2 size={16} className="spin" style={{ left: 'auto', right: 12 }} />}
                  <input
                    id="f-postal_code"
                    className="input"
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    value={draft.postal_code}
                    onChange={(ev) => {
                      const v = ev.target.value.replace(/\D/g, '').slice(0, 8);
                      set({ postal_code: v.length > 5 ? `${v.slice(0, 5)}-${v.slice(5)}` : v });
                      if (v.length === 8) lookupCep(v);
                    }}
                  />
                </div>
              </Field>
              {input('street', 'Rua *', { autoComplete: 'address-line1' }, 'span-4')}
              {input('address_number', 'Número', { inputMode: 'text' }, 'span-2')}
              {input('address_complement', 'Complemento', { placeholder: 'Apto, bloco, casa…' }, 'span-4')}
              {input('neighborhood', 'Bairro', {}, 'span-2')}
              {input('city', 'Cidade', {}, 'span-2')}
              {input('state', 'Estado', { maxLength: 2, placeholder: 'AM', style: { textTransform: 'uppercase' } }, 'span-2')}
              {input('reference_point', 'Ponto de referência', {}, 'span-6')}
              {draft.address_text && (
                <div className="span-6 banner tone-neutral small">
                  <ClipboardList size={16} />
                  <span>
                    Endereço original (agenda antiga): <b>{draft.address_text}</b>
                  </span>
                </div>
              )}
            </div>
          )}
        </Section>

        <Section
          icon={<Package size={15} />}
          title="Materiais a entregar"
          aside={
            <Button size="sm" icon={<Plus size={15} />} onClick={() => set({ items: [...draft.items, emptyItem()] })}>
              Adicionar material
            </Button>
          }
        >
          {draft.items.length === 0 && <p className="small muted">Nenhum material listado. Adicione os itens para usar a conferência por item, ou descreva abaixo.</p>}
          <div className="stack">
            {draft.items.map((it, idx) => (
              <div key={it.key} className="card pad" style={{ padding: 12 }}>
                <div className="form-grid">
                  <Field className="span-6" label={`Material ${idx + 1}`} htmlFor={`it-d-${it.key}`} error={e[`items.${idx}.description`]}>
                    <input
                      id={`it-d-${it.key}`}
                      className="input"
                      placeholder="Ex.: Piso SPC Carvalho"
                      value={it.description}
                      onChange={(ev) => setItem(it.key, { description: ev.target.value })}
                    />
                  </Field>
                  <Field className="span-2" label="Quantidade" htmlFor={`it-q-${it.key}`} error={e[`items.${idx}.quantity`]}>
                    <input id={`it-q-${it.key}`} className="input" inputMode="decimal" value={it.quantity} onChange={(ev) => setItem(it.key, { quantity: ev.target.value })} />
                  </Field>
                  <Field className="span-2" label="Unidade" htmlFor={`it-u-${it.key}`}>
                    <select id={`it-u-${it.key}`} className="select" value={it.unit} onChange={(ev) => setItem(it.key, { unit: ev.target.value })}>
                      {UNITS.map((u) => (
                        <option key={u}>{u}</option>
                      ))}
                    </select>
                  </Field>
                  <Field className="span-2" label="Volumes" htmlFor={`it-p-${it.key}`} error={e[`items.${idx}.package_count`]} hint={it.unit === 'm²' || it.unit === 'm' ? 'Nº de caixas/rolos' : undefined}>
                    <input id={`it-p-${it.key}`} className="input" inputMode="numeric" value={it.package_count} onChange={(ev) => setItem(it.key, { package_count: ev.target.value })} />
                  </Field>
                  <Field className="span-2" label="Peso (kg)" htmlFor={`it-w-${it.key}`} error={e[`items.${idx}.weight_kg`]}>
                    <input id={`it-w-${it.key}`} className="input" inputMode="decimal" value={it.weight_kg} onChange={(ev) => setItem(it.key, { weight_kg: ev.target.value })} />
                  </Field>
                  <div className="span-4 row" style={{ alignSelf: 'end', justifyContent: 'flex-end' }}>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Trash2 size={15} />}
                      aria-label={`Remover material ${idx + 1}`}
                      onClick={() => set({ items: draft.items.filter((x) => x.key !== it.key) })}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Field label="Observações sobre o material" htmlFor="f-materials_notes" hint="Texto livre (ex.: cor, lote, cuidados no transporte).">
            <textarea id="f-materials_notes" className="textarea" value={draft.materials_notes} onChange={(ev) => set({ materials_notes: ev.target.value })} />
          </Field>
        </Section>

        <Section icon={<Flame size={15} />} title="Agendamento">
          <ScheduleFields value={draft} onChange={(p) => set(p)} errors={e} />
          <div className="field">
            <span className="label">Urgência</span>
            <div className="row wrap" role="group" aria-label="Urgência">
              {URGENCIES.map((u) => (
                <button
                  key={u.value}
                  type="button"
                  className={cx('chip', `urg-${u.value}`)}
                  aria-pressed={draft.urgency === u.value}
                  onClick={() => set({ urgency: draft.urgency === u.value ? '' : u.value })}
                >
                  {u.label}
                </button>
              ))}
            </div>
            <span className="hint">Toque de novo na opção escolhida para tirar a marcação.</span>
          </div>
          <div className="form-grid">
            <Field className="span-3" label="Observações para o entregador" htmlFor="f-driver_notes" hint="Aparece no celular do entregador.">
              <textarea id="f-driver_notes" className="textarea" value={draft.driver_notes} onChange={(ev) => set({ driver_notes: ev.target.value })} />
            </Field>
            <Field className="span-3" label="Notas internas" htmlFor="f-internal_notes" hint="Visível só para a administração.">
              <textarea id="f-internal_notes" className="textarea" value={draft.internal_notes} onChange={(ev) => set({ internal_notes: ev.target.value })} />
            </Field>
          </div>
        </Section>

        <Section icon={<ClipboardList size={15} />} title="Preparação">
          {draft.items.length === 0 ? (
            <div className="field">
              <span className="label">Material separado?</span>
              <Segmented
                label="Material separado?"
                value={draft.material_separated ? 'sim' : 'nao'}
                onChange={(v) => set({ material_separated: v === 'sim' })}
                options={[
                  { value: 'nao', label: 'Não' },
                  { value: 'sim', label: 'Sim' },
                ]}
              />
            </div>
          ) : (
            <div className="checklist">
              {draft.items.map((it, idx) => (
                <div key={it.key} className={cx('check-row', it.prepared && it.checked && 'done')}>
                  <div className="grow small strong truncate">{it.description || `Material ${idx + 1}`}</div>
                  <label className="check small">
                    <input type="checkbox" checked={it.prepared || it.checked} onChange={(ev) => setItem(it.key, { prepared: ev.target.checked, checked: ev.target.checked ? it.checked : false })} />
                    Separado
                  </label>
                  <label className="check small">
                    <input type="checkbox" checked={it.checked} onChange={(ev) => setItem(it.key, { checked: ev.target.checked, prepared: ev.target.checked || it.prepared })} />
                    Conferido
                  </label>
                </div>
              ))}
            </div>
          )}
          {delivery?.prepared_at && (
            <p className="small muted">
              Material pronto desde {formatDateTime(delivery.prepared_at)}
              {delivery.prepared_by_name ? ` · por ${delivery.prepared_by_name}` : ''}
            </p>
          )}
          <p className="tiny muted">A entrega só fica “Pronta para entrega” quando tem data e todo o material está separado e conferido.</p>
        </Section>
      </form>
    </Modal>
  );
}
