import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Ban,
  CalendarClock,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Edit3,
  History,
  MapPin,
  Package,
  PackageCheck,
  Phone,
  RotateCcw,
  ShieldAlert,
  StickyNote,
  Truck,
} from 'lucide-react';
import {
  STATUS_META,
  formatAddress,
  formatDateBR,
  formatDateTime,
  formatPhone,
  formatPostalCode,
  periodLabel,
  problemLabel,
} from '../../shared/domain.ts';
import type { Delivery, FieldErrors, Status } from '../../shared/domain.ts';
import { ApiError, api, photoUrl, post } from '../api.ts';
import { invalidateAll, useResource, useSession } from '../lib.tsx';
import { Badge, Button, ErrorState, Field, Modal, Skeleton, StatusBadge, UrgencyBadge, useConfirm, useToast } from './ui.tsx';
import { Checklist, NavButtons, ProblemDialog, ProofDialog, ScheduleDialog, ScheduleFields, WhatsAppButton, scheduleState, useAction } from './actions.tsx';
import { PrepIndicator, scheduleText } from './DeliveryCard.tsx';

export interface Problem {
  id: number;
  problem_type: string;
  description: string | null;
  reported_by_name: string;
  reported_at: string;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by_name: string | null;
  resolution_notes: string | null;
}
interface Proof {
  id: number;
  receiver_name: string;
  photo_id: number | string | null;
  /** Todas as fotos do comprovante (comprovantes antigos têm só photo_id). */
  photo_ids?: (number | string)[];
  notes: string | null;
  completed_at: string;
  completed_by_name: string;
}
interface Event {
  id: number;
  type: string;
  previous_status: Status | null;
  new_status: Status | null;
  details: any;
  reason: string | null;
  changed_at: string;
  changed_by_name: string | null;
}
export interface Detail {
  delivery: Delivery;
  problems: Problem[];
  proofs: Proof[];
  events: Event[];
}

const FIELD_LABELS: Record<string, string> = {
  customer_name: 'cliente',
  receiver_whatsapp: 'WhatsApp',
  salesperson: 'vendedor',
  order_number: 'nº do pedido',
  postal_code: 'CEP',
  street: 'rua',
  address_number: 'número',
  address_complement: 'complemento',
  neighborhood: 'bairro',
  city: 'cidade',
  state: 'estado',
  reference_point: 'referência',
  address_text: 'endereço',
  materials_notes: 'observações do material',
  urgency: 'urgência',
  driver_notes: 'observações',
  internal_notes: 'notas internas',
  material_separated: 'material separado',
};
const STAGE: Record<string, string> = { prepared: 'separado', checked: 'conferido', loaded: 'carregado' };

function sched(s: any) {
  if (!s?.data) return 'sem data';
  return `${formatDateBR(s.data)} · ${periodLabel(s.periodo)}${s.inicio ? ` ${s.inicio}${s.fim ? `–${s.fim}` : ''}` : ''} · ${s.entregador ?? 'sem entregador'}`;
}

function eventText(e: Event): ReactNode {
  switch (e.type) {
    case 'criada':
      return 'Entrega criada';
    case 'importada':
      return `Importada da agenda antiga${e.details?.situacao_original ? ` (situação: ${e.details.situacao_original})` : ''}`;
    case 'status':
      return (
        <>
          Situação: {e.previous_status ? STATUS_META[e.previous_status].label : '—'} → <b>{e.new_status ? STATUS_META[e.new_status].label : '—'}</b>
        </>
      );
    case 'agendamento':
      return `Agendada: ${sched(e.details?.depois)}`;
    case 'reagendamento':
      return (
        <>
          Reagendada de <s>{sched(e.details?.antes)}</s> para <b>{sched(e.details?.depois)}</b>
        </>
      );
    case 'edicao': {
      const f: string[] = (e.details?.campos ?? []).map((c: string) => FIELD_LABELS[c] ?? c);
      const removed: string[] = e.details?.materiais_removidos ?? [];
      return `Dados editados${f.length ? `: ${f.join(', ')}` : ''}${removed.length ? ` · materiais removidos: ${removed.join(', ')}` : ''}`;
    }
    case 'preparo':
    case 'carregamento':
      if (e.details?.todos) return `Todos os materiais marcados como ${STAGE[e.details.etapa]}`;
      if (e.details?.material_separado !== undefined) return `Material separado: ${e.details.material_separado ? 'sim' : 'não'}`;
      return `${e.details?.item}: ${e.details?.valor ? '' : 'desmarcado '}${STAGE[e.details?.etapa] ?? ''}`;
    case 'problema':
      return `Problema informado: ${problemLabel(e.details?.tipo)}`;
    case 'problema_resolvido':
      return 'Problema resolvido';
    case 'excecao_preparo':
      return 'Liberada sem conferência completa (exceção)';
    case 'excecao_removida':
      return 'Exceção de preparo removida';
    default:
      return e.type;
  }
}

function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="row top" style={{ gap: 10 }}>
      <span className="muted" style={{ marginTop: 2 }} aria-hidden>
        {icon}
      </span>
      <div className="grow">
        <div className="tiny muted">{label}</div>
        <div className="small">{children}</div>
      </div>
    </div>
  );
}

function Section({ title, icon, children, aside }: { title: string; icon: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="stack">
      <div className="row between">
        <h3 className="h-section row">
          {icon} {title}
        </h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function ProofView({ proof }: { proof: Proof }) {
  const photos = proof.photo_ids?.length ? proof.photo_ids : proof.photo_id != null ? [proof.photo_id] : [];
  return (
    <div className="card pad stack tight">
      <div className="row between wrap">
        <span className="strong">Recebido por {proof.receiver_name}</span>
        <span className="tiny muted">{formatDateTime(proof.completed_at)}</span>
      </div>
      <span className="small muted">Entregador: {proof.completed_by_name}</span>
      {proof.notes && <p className="small">{proof.notes}</p>}
      {photos.length > 0 ? (
        <div className="photo-grid proof">
          {photos.map((id, i) => (
            <a key={id} className="photo-tile" href={photoUrl(id)} target="_blank" rel="noopener noreferrer">
              <img src={photoUrl(id)} alt={`Foto ${i + 1} da entrega recebida por ${proof.receiver_name}`} loading="lazy" />
            </a>
          ))}
        </div>
      ) : (
        <span className="tiny muted row">
          <Camera size={13} /> Sem foto
        </span>
      )}
    </div>
  );
}

function ProblemCard({ p, delivery }: { p: Problem; delivery: Delivery }) {
  const [notes, setNotes] = useState(p.admin_notes ?? '');
  const [resolving, setResolving] = useState(false);
  const { busy, run } = useAction();
  return (
    <div className="card pad stack tight" style={{ borderColor: p.resolved_at ? undefined : '#fecaca' }}>
      <div className="row between wrap">
        <span className="strong row">
          {p.resolved_at ? <CheckCircle2 size={16} color="#16A34A" /> : <AlertTriangle size={16} color="#DC2626" />} {problemLabel(p.problem_type)}
        </span>
        <Badge tone={p.resolved_at ? 'success' : 'danger'}>{p.resolved_at ? 'Resolvido' : 'Em aberto'}</Badge>
      </div>
      <span className="tiny muted">
        Informado por {p.reported_by_name} em {formatDateTime(p.reported_at)}
      </span>
      {p.description && <p className="small">“{p.description}”</p>}
      {p.resolved_at ? (
        <>
          {p.admin_notes && <p className="small muted">Notas internas: {p.admin_notes}</p>}
          <p className="small">
            <b>Solução:</b> {p.resolution_notes} <span className="tiny muted">— {p.resolved_by_name}, {formatDateTime(p.resolved_at)}</span>
          </p>
        </>
      ) : (
        <>
          <Field label="Notas internas" htmlFor={`pn-${p.id}`}>
            <textarea id={`pn-${p.id}`} className="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          <div className="row wrap">
            <Button size="sm" loading={busy} disabled={notes === (p.admin_notes ?? '')} onClick={() => run(() => api(`/api/problems/${p.id}`, { method: 'PATCH', body: { admin_notes: notes } }), 'Notas salvas.')}>
              Salvar notas
            </Button>
            <Button size="sm" variant="primary" icon={<CheckCircle2 size={15} />} onClick={() => setResolving(true)}>
              Resolver problema
            </Button>
          </div>
        </>
      )}
      {resolving && <ResolveDialog problem={p} delivery={delivery} onClose={() => setResolving(false)} />}
    </div>
  );
}

function ResolveDialog({ problem, delivery, onClose }: { problem: Problem; delivery: Delivery; onClose: () => void }) {
  const [notes, setNotes] = useState('');
  const [reschedule, setReschedule] = useState(false);
  const [value, setValue] = useState(scheduleState(delivery));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const submit = async () => {
    setBusy(true);
    try {
      await post(`/api/problems/${problem.id}/resolve`, { resolution_notes: notes, schedule: reschedule ? value : undefined });
      toast(reschedule ? 'Problema resolvido e entrega reagendada.' : 'Problema resolvido.');
      invalidateAll();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Erro ao resolver.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title="Resolver problema"
      subtitle={`${problemLabel(problem.problem_type)} · ${delivery.customer_name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={busy} onClick={submit}>
            Marcar como resolvido
          </Button>
        </>
      }
    >
      <div className="stack">
        <Field label="Como foi resolvido? *" htmlFor="res-notes" error={errors.resolution_notes}>
          <textarea id="res-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: cliente confirmou novo dia por telefone" autoFocus />
        </Field>
        <label className="check">
          <input type="checkbox" checked={reschedule} onChange={(e) => setReschedule(e.target.checked)} />
          Reagendar ou trocar o entregador agora
        </label>
        {reschedule && <ScheduleFields value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />}
        <p className="tiny muted">O problema continua no histórico da entrega.</p>
      </div>
    </Modal>
  );
}

export function DeliveryDrawer({ id, onClose, onEdit }: { id: number | null; onClose: () => void; onEdit: (d: Delivery) => void }) {
  const res = useResource<Detail>(id ? `/api/deliveries/${id}` : null);
  const { config } = useSession();
  const confirm = useConfirm();
  const { busy, run } = useAction();
  const [dialog, setDialog] = useState<null | 'schedule' | 'proof' | 'problem'>(null);
  useEffect(() => setDialog(null), [id]);
  const data = res.data?.delivery.id === id ? res.data : undefined;
  const d = data?.delivery;

  const action = async (path: string, opts: { title: string; message?: string; reason?: string; label: string; danger?: boolean; ok: string }) => {
    const r = await confirm({
      title: opts.title,
      message: opts.message,
      confirmLabel: opts.label,
      danger: opts.danger,
      reason: opts.reason ? { label: opts.reason, required: true } : undefined,
    });
    if (r) run(() => post(`/api/deliveries/${id}/${path}`, { reason: r.reason }), opts.ok);
  };

  const addr = d ? formatAddress(d) : null;
  const final = d?.status === 'entregue' || d?.status === 'cancelada';

  return (
    <Modal
      open={id != null}
      onClose={onClose}
      variant="drawer"
      title={d ? d.customer_name : 'Carregando…'}
      subtitle={d ? [d.order_number && `Pedido #${d.order_number}`, `Atualizada em ${formatDateTime(d.updated_at)}`].filter(Boolean).join(' · ') : undefined}
      footer={
        d && (
          <div className="row wrap foot-actions" style={{ width: '100%', justifyContent: 'flex-end' }}>
            {!final && (
              <Button variant="danger-outline" icon={<Ban size={15} />} onClick={() => action('cancel', { title: 'Cancelar entrega?', reason: 'Motivo do cancelamento', label: 'Cancelar entrega', danger: true, ok: 'Entrega cancelada.' })}>
                Cancelar entrega
              </Button>
            )}
            {final && (
              <Button icon={<RotateCcw size={15} />} onClick={() => action('reopen', { title: 'Reabrir entrega?', message: 'A entrega volta para a agenda. O comprovante e o histórico são mantidos.', reason: 'Motivo da reabertura', label: 'Reabrir', ok: 'Entrega reaberta.' })}>
                Reabrir
              </Button>
            )}
            {!final && (
              <Button variant="danger-outline" icon={<AlertTriangle size={15} />} onClick={() => setDialog('problem')}>
                Informar problema
              </Button>
            )}
            {d.status === 'pronta' && (
              <Button variant="primary" icon={<Truck size={15} />} loading={busy} disabled={!d.driver_id} onClick={() => run(() => post(`/api/deliveries/${d.id}/start`), 'Entrega em rota.')}>
                Marcar em rota
              </Button>
            )}
            {['pronta', 'em_rota', 'problema'].includes(d.status) && (
              <Button variant="success" icon={<PackageCheck size={15} />} onClick={() => setDialog('proof')}>
                Confirmar entrega
              </Button>
            )}
          </div>
        )
      }
    >
      {res.error && !data ? (
        <ErrorState error={res.error} onRetry={res.reload} />
      ) : !d || !data ? (
        <Skeleton count={4} h={90} />
      ) : (
        <div className="stack loose">
          <div className="row wrap">
            <StatusBadge status={d.status} />
            <UrgencyBadge urgency={d.urgency} />
            <PrepIndicator d={d} />
          </div>
          <div className="row wrap">
            <Button size="sm" icon={<Edit3 size={15} />} onClick={() => onEdit(d)} disabled={final}>
              Editar
            </Button>
            {!final && (
              <Button size="sm" icon={<CalendarClock size={15} />} onClick={() => setDialog('schedule')}>
                {d.delivery_date ? 'Reagendar' : 'Agendar'}
              </Button>
            )}
            <WhatsAppButton delivery={d} template={d.status === 'problema' ? 'problema' : d.status === 'entregue' ? 'concluida' : 'a_caminho'} />
            <NavButtons delivery={d} />
          </div>

          {d.status === 'problema' && data.problems.some((p) => !p.resolved_at) && (
            <div className="banner tone-danger" role="alert">
              <ShieldAlert size={18} />
              <span>Esta entrega tem problema em aberto. Veja abaixo e resolva para liberá-la novamente.</span>
            </div>
          )}

          <Section title="Entrega" icon={<MapPin size={16} />}>
            <div className="card pad stack">
              <InfoRow icon={<MapPin size={15} />} label="Endereço">
                {addr!.line1 || <span className="muted">Sem endereço</span>}
                {addr!.line2 && <div className="muted">{addr!.line2}</div>}
                {d.postal_code && <div className="muted">CEP {formatPostalCode(d.postal_code)}</div>}
                {d.reference_point && <div className="muted">Referência: {d.reference_point}</div>}
              </InfoRow>
              <InfoRow icon={<CalendarClock size={15} />} label="Agendamento">
                {scheduleText(d, config.today)} · {d.driver_name ?? 'Sem entregador'}
              </InfoRow>
              <InfoRow icon={<Phone size={15} />} label="WhatsApp de quem recebe">
                {d.receiver_whatsapp ? formatPhone(d.receiver_whatsapp) : <span className="muted">Não informado</span>}
              </InfoRow>
              {d.salesperson && (
                <InfoRow icon={<Circle size={15} />} label="Vendedor">
                  {d.salesperson}
                </InfoRow>
              )}
              {d.legacy_situacao && (
                <InfoRow icon={<History size={15} />} label="Situação na agenda antiga">
                  {d.legacy_situacao}
                </InfoRow>
              )}
            </div>
          </Section>

          {(d.driver_notes || d.internal_notes) && (
            <Section title="Observações" icon={<StickyNote size={16} />}>
              {d.driver_notes && (
                <div className="banner tone-accent small">
                  <StickyNote size={15} />
                  <div>
                    <div className="tiny strong">Para o entregador</div>
                    <span style={{ whiteSpace: 'pre-line' }}>{d.driver_notes}</span>
                  </div>
                </div>
              )}
              {d.internal_notes && (
                <div className="banner tone-neutral small">
                  <StickyNote size={15} />
                  <div>
                    <div className="tiny strong">Notas internas (não aparecem para o entregador)</div>
                    <span style={{ whiteSpace: 'pre-line' }}>{d.internal_notes}</span>
                  </div>
                </div>
              )}
            </Section>
          )}

          <Section title="Materiais e conferência" icon={<Package size={16} />}>
            {d.items.length ? (
              <Checklist delivery={d} stages={['prepared', 'checked', 'loaded']} readOnly={final} />
            ) : (
              <div className="card pad row between wrap">
                <span className="small">{d.materials_notes ? 'Materiais descritos em texto (sem itens para conferir).' : 'Nenhum material cadastrado.'}</span>
                {!final && (
                  <label className="check small">
                    <input
                      type="checkbox"
                      checked={d.material_separated}
                      disabled={busy}
                      onChange={(e) => run(() => post(`/api/deliveries/${d.id}/material-separated`, { value: e.target.checked }), e.target.checked ? 'Material marcado como separado.' : 'Marcação removida.')}
                    />
                    Material separado
                  </label>
                )}
              </div>
            )}
            {d.materials_notes && <p className="small" style={{ whiteSpace: 'pre-line' }}>{d.materials_notes}</p>}
            {!final && d.status === 'aguardando_separacao' && !d.prep_exception_reason && (
              <Button
                size="sm"
                variant="ghost"
                icon={<ClipboardCheck size={15} />}
                onClick={async () => {
                  const r = await confirm({
                    title: 'Liberar sem conferência completa?',
                    message: 'Use somente em casos excepcionais. A justificativa fica registrada no histórico.',
                    reason: { label: 'Justificativa', required: true },
                    confirmLabel: 'Liberar',
                  });
                  if (r) run(() => post(`/api/deliveries/${d.id}/prep-exception`, { reason: r.reason }), 'Entrega liberada por exceção.');
                }}
              >
                Liberar por exceção
              </Button>
            )}
            {d.prep_exception_reason && (
              <div className="banner tone-warning small">
                <ShieldAlert size={15} />
                <div className="grow">
                  Liberada por exceção: “{d.prep_exception_reason}”
                  {!final && (
                    <div>
                      <Button size="sm" variant="ghost" onClick={() => run(() => post(`/api/deliveries/${d.id}/prep-exception`, { clear: true }), 'Exceção removida.')}>
                        Remover exceção
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Section>

          {data.problems.length > 0 && (
            <Section title={`Problemas (${data.problems.length})`} icon={<AlertTriangle size={16} />}>
              {data.problems.map((p) => (
                <ProblemCard key={p.id} p={p} delivery={d} />
              ))}
            </Section>
          )}

          {data.proofs.length > 0 && (
            <Section title="Comprovante de entrega" icon={<CheckCircle2 size={16} />}>
              {data.proofs.map((p) => (
                <ProofView key={p.id} proof={p} />
              ))}
            </Section>
          )}

          <Section title="Histórico" icon={<History size={16} />}>
            <ol className="timeline">
              {data.events.map((e) => (
                <li key={e.id}>
                  <span className="tl-dot" aria-hidden>
                    <Circle size={8} fill="currentColor" />
                  </span>
                  <div>
                    <div className="small">{eventText(e)}</div>
                    {e.reason && <div className="small muted">Motivo: {e.reason}</div>}
                    <div className="tiny muted">
                      {formatDateTime(e.changed_at)}
                      {e.changed_by_name ? ` · ${e.changed_by_name}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        </div>
      )}
      {d && dialog === 'schedule' && <ScheduleDialog delivery={d} open onClose={() => setDialog(null)} />}
      {d && dialog === 'proof' && <ProofDialog delivery={d} open onClose={() => setDialog(null)} />}
      {d && dialog === 'problem' && <ProblemDialog delivery={d} open onClose={() => setDialog(null)} />}
    </Modal>
  );
}
