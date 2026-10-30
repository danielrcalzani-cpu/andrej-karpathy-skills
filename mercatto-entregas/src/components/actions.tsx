import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ExternalLink,
  ImageOff,
  MapPinOff,
  MessageCircle,
  Navigation,
  PackageCheck,
  RefreshCw,
  Trash2,
  Truck,
} from 'lucide-react';
import {
  PERIODS,
  PROBLEM_TYPES,
  STAGE_LABEL,
  WHATSAPP_TEMPLATES,
  addDays,
  formatDateBR,
  formatDateTime,
  formatPhone,
  googleMapsUrl,
  itemLine,
  loadProgress,
  navigationQuery,
  normalizeWhatsApp,
  periodLabel,
  prepProgress,
  progressText,
  wazeUrl,
  whatsappUrl,
} from '../../shared/domain.ts';
import type { Delivery, DeliveryItem, FieldErrors, ItemStage } from '../../shared/domain.ts';
import { ApiError, compressImage, post, uploadPhoto } from '../api.ts';
import { invalidateAll, useResource, useSession } from '../lib.tsx';
import { Badge, Button, Field, Modal, ProgressBar, cx, useConfirm, useToast } from './ui.tsx';

/** Executa uma ação na API com feedback e sincronização. */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async <T,>(fn: () => Promise<T>, success?: string): Promise<T | null> => {
    if (busy) return null;
    setBusy(true);
    try {
      const r = await fn();
      if (success) toast(success);
      invalidateAll();
      return r;
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível concluir.', 'error');
      if (e instanceof ApiError && e.status === 409) invalidateAll();
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

// ---------------------------------------------------------------------------
// Navegação

export function useNavQuery(d: Delivery) {
  const { config } = useSession();
  return useMemo(() => navigationQuery(d, { city: config.default_city, state: config.default_state }), [d, config]);
}

export function NavButtons({ delivery, tiles }: { delivery: Delivery; tiles?: boolean }) {
  const q = useNavQuery(delivery);
  if (!q) {
    return (
      <div className="banner tone-warning small" role="note">
        <MapPinOff size={16} />
        <span>Endereço incompleto para navegação. Confira rua, número e cidade com o escritório.</span>
      </div>
    );
  }
  const linkProps = { target: '_blank', rel: 'noopener noreferrer' };
  if (tiles)
    return (
      <>
        <a className="action-tile" href={googleMapsUrl(q)} {...linkProps}>
          <Navigation size={22} color="#2563EB" aria-hidden />
          Google Maps
        </a>
        <a className="action-tile" href={wazeUrl(q)} {...linkProps}>
          <Navigation size={22} color="#33CCFF" aria-hidden style={{ transform: 'rotate(45deg)' }} />
          Waze
        </a>
      </>
    );
  return (
    <>
      <a className="btn sm" href={googleMapsUrl(q)} {...linkProps}>
        <Navigation size={15} aria-hidden /> Maps
      </a>
      <a className="btn sm" href={wazeUrl(q)} {...linkProps}>
        <Navigation size={15} aria-hidden style={{ transform: 'rotate(45deg)' }} /> Waze
      </a>
    </>
  );
}

// ---------------------------------------------------------------------------
// WhatsApp: abre a conversa com mensagem editável. Não afirma que a mensagem foi enviada.

export function WhatsAppDialog({ delivery, open, onClose, template = 'a_caminho' }: { delivery: Delivery; open: boolean; onClose: () => void; template?: string }) {
  const [tpl, setTpl] = useState(template);
  const [text, setText] = useState('');
  useEffect(() => {
    if (open) {
      setTpl(template);
      setText(WHATSAPP_TEMPLATES.find((t) => t.id === template)!.build(delivery));
    }
  }, [open, template, delivery]);
  const url = delivery.receiver_whatsapp ? whatsappUrl(delivery.receiver_whatsapp, text) : null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mensagem pelo WhatsApp"
      subtitle={delivery.receiver_whatsapp ? `Para ${formatPhone(delivery.receiver_whatsapp)}` : undefined}
      icon={<MessageCircle size={20} color="#16A34A" />}
      footer={
        <>
          <Button onClick={onClose}>Fechar</Button>
          {url && (
            <a className="btn success" href={url} target="_blank" rel="noopener noreferrer" onClick={onClose}>
              <ExternalLink size={16} /> Abrir no WhatsApp
            </a>
          )}
        </>
      }
    >
      {!url ? (
        <div className="banner tone-warning">
          <AlertTriangle size={16} />
          <span>
            {delivery.receiver_whatsapp ? 'O número cadastrado é inválido.' : 'Nenhum WhatsApp cadastrado para esta entrega.'} Peça ao escritório para corrigir o
            cadastro.
          </span>
        </div>
      ) : (
        <div className="stack">
          <div className="row wrap">
            {WHATSAPP_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="chip"
                aria-pressed={tpl === t.id}
                onClick={() => {
                  setTpl(t.id);
                  setText(t.build(delivery));
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Field label="Mensagem (você pode editar)" htmlFor="wa-text">
            <textarea id="wa-text" className="textarea" rows={5} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <p className="tiny muted">O WhatsApp será aberto com a mensagem pronta. Ela só é enviada quando você tocar em enviar no WhatsApp.</p>
        </div>
      )}
    </Modal>
  );
}

export function WhatsAppButton({ delivery, tile, template }: { delivery: Delivery; tile?: boolean; template?: string }) {
  const [open, setOpen] = useState(false);
  const valid = !!normalizeWhatsApp(delivery.receiver_whatsapp);
  return (
    <>
      {tile ? (
        <button type="button" className="action-tile" onClick={() => setOpen(true)} aria-disabled={!valid}>
          <MessageCircle size={22} color="#16A34A" aria-hidden />
          WhatsApp
        </button>
      ) : (
        <Button size="sm" onClick={() => setOpen(true)} icon={<MessageCircle size={15} color="#16A34A" />} title={valid ? undefined : 'Sem WhatsApp válido'}>
          WhatsApp
        </Button>
      )}
      <WhatsAppDialog delivery={delivery} open={open} onClose={() => setOpen(false)} template={template} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Comprovante de entrega

export function ProofDialog({ delivery, open, onClose }: { delivery: Delivery; open: boolean; onClose: () => void }) {
  const { config } = useSession();
  const toast = useToast();
  const [receiver, setReceiver] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoId, setPhotoId] = useState<number | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDone(false);
      setErrors({});
    }
  }, [open]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const reset = () => {
    setReceiver('');
    setNotes('');
    clearPhoto();
  };
  const clearPhoto = () => {
    setFile(null);
    setPreview(null);
    setPhotoId(null);
    setProgress(null);
    setPhotoError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setPhotoError(null);
    setPhotoId(null);
    if (!/^image\//.test(f.type)) {
      setPhotoError('Escolha um arquivo de imagem (foto).');
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      setPhotoError('Imagem grande demais (máx. 25 MB antes da compressão).');
      return;
    }
    try {
      const blob = await compressImage(f);
      if (blob.size > config.max_photo_mb * 1024 * 1024) throw new Error(`A foto ficou maior que ${config.max_photo_mb} MB mesmo após compressão.`);
      setFile(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setPhotoError(e instanceof Error ? e.message : 'Não foi possível usar esta foto.');
    }
  };

  const submit = async (skipPhoto = false) => {
    if (receiver.trim().length < 2) {
      setErrors({ receiver_name: 'Informe o nome de quem recebeu.' });
      return;
    }
    setBusy(true);
    setErrors({});
    let pid = photoId;
    try {
      if (file && !pid && !skipPhoto) {
        setProgress(0);
        try {
          pid = (await uploadPhoto(delivery.id, file, setProgress)).photo_id;
          setPhotoId(pid);
        } catch (e) {
          setProgress(null);
          setPhotoError(`${e instanceof Error ? e.message : 'Falha no envio.'} A entrega ainda NÃO foi confirmada.`);
          return;
        }
      }
      await post(`/api/deliveries/${delivery.id}/complete`, { receiver_name: receiver, notes, photo_id: skipPhoto ? null : pid });
      setDone(true);
      reset();
      invalidateAll();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Não foi possível confirmar.', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <>
        <Modal
          open={open && !waOpen}
          onClose={onClose}
          title="Entrega confirmada"
          icon={<CheckCircle2 size={22} color="#16A34A" />}
          footer={
            <>
              <Button onClick={onClose}>Concluir</Button>
              <Button variant="success" icon={<MessageCircle size={16} />} onClick={() => setWaOpen(true)}>
                Avisar cliente
              </Button>
            </>
          }
        >
          <p>
            A entrega de <b>{delivery.customer_name}</b> foi registrada como concluída e o comprovante foi salvo.
          </p>
        </Modal>
        <WhatsAppDialog
          delivery={delivery}
          open={open && waOpen}
          template="concluida"
          onClose={() => {
            setWaOpen(false);
            onClose();
          }}
        />
      </>
    );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirmar entrega"
      subtitle={`${delivery.customer_name}${delivery.order_number ? ` · Pedido ${delivery.order_number}` : ''}`}
      icon={<PackageCheck size={22} color="#16A34A" />}
      variant="full"
      footer={
        <>
          <Button onClick={onClose} disabled={busy}>
            Voltar
          </Button>
          <Button variant="success" size="lg" loading={busy} onClick={() => submit()} icon={<Check size={18} />}>
            Confirmar entrega
          </Button>
        </>
      }
    >
      <div className="stack loose">
        <Field label="Quem recebeu? *" htmlFor="pod-receiver" error={errors.receiver_name}>
          <input
            id="pod-receiver"
            className="input"
            autoComplete="off"
            autoCapitalize="words"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            aria-invalid={!!errors.receiver_name}
            placeholder="Nome de quem recebeu o material"
          />
        </Field>
        <div className="field">
          <span className="label">Foto da entrega (opcional)</span>
          <input ref={inputRef} type="file" accept="image/*" capture="environment" className="sr-only" id="pod-photo" onChange={(e) => pick(e.target.files?.[0])} />
          {preview ? (
            <div className="stack tight">
              <img src={preview} alt="Pré-visualização da foto da entrega" className="photo-preview" />
              {progress != null && (
                <div className="stack tight">
                  <ProgressBar value={progress} max={100} />
                  <span className="tiny muted">{photoId ? 'Foto enviada.' : `Enviando foto… ${progress}%`}</span>
                </div>
              )}
              <div className="row">
                <Button size="sm" icon={<Camera size={15} />} onClick={() => inputRef.current?.click()} disabled={busy}>
                  Trocar foto
                </Button>
                <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={clearPhoto} disabled={busy}>
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <Button size="lg" block icon={<Camera size={20} />} onClick={() => inputRef.current?.click()}>
              Tirar foto
            </Button>
          )}
          {photoError && (
            <div className="banner tone-danger small" role="alert">
              <ImageOff size={16} />
              <div className="stack tight grow">
                <span>{photoError}</span>
                {file && !photoId && (
                  <div className="row wrap">
                    <Button size="sm" icon={<RefreshCw size={14} />} onClick={() => submit()} disabled={busy}>
                      Tentar enviar de novo
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => submit(true)} disabled={busy}>
                      Confirmar sem foto
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <Field label="Observações (opcional)" htmlFor="pod-notes">
          <textarea id="pod-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: material conferido pelo cliente" />
        </Field>
        <p className="tiny muted">Data, hora e entregador são registrados automaticamente.</p>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Problema

export function ProblemDialog({ delivery, open, onClose }: { delivery: Delivery; open: boolean; onClose: () => void }) {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const { busy, run } = useAction();
  useEffect(() => {
    if (open) {
      setType('');
      setDesc('');
      setErrors({});
    }
  }, [open]);
  const submit = async () => {
    if (!type) return setErrors({ problem_type: 'Escolha uma opção.' });
    if (type === 'outro' && !desc.trim()) return setErrors({ description: 'Descreva o que aconteceu.' });
    const r = await run(() => post(`/api/deliveries/${delivery.id}/problems`, { problem_type: type, description: desc }), 'Problema registrado. O escritório foi avisado no painel.');
    if (r) onClose();
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Informar problema"
      subtitle={delivery.customer_name}
      icon={<AlertTriangle size={20} color="#DC2626" />}
      variant="full"
      footer={
        <>
          <Button onClick={onClose}>Voltar</Button>
          <Button variant="danger" size="lg" loading={busy} onClick={submit}>
            Registrar problema
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="stack tight" role="radiogroup" aria-label="Tipo de problema">
          {PROBLEM_TYPES.map((p) => (
            <label key={p.value} className={cx('check card')} style={{ padding: '6px 12px', borderColor: type === p.value ? 'var(--danger)' : undefined }}>
              <input type="radio" name="problem" value={p.value} checked={type === p.value} onChange={() => setType(p.value)} />
              {p.label}
            </label>
          ))}
          {errors.problem_type && <span className="error small">{errors.problem_type}</span>}
        </div>
        <Field label={type === 'outro' ? 'Descrição *' : 'Descrição (opcional)'} htmlFor="prob-desc" error={errors.description}>
          <textarea id="prob-desc" className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Conte o que aconteceu" />
        </Field>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Checklist de materiais (separado → conferido → carregado)

export function Checklist({ delivery, stages, readOnly }: { delivery: Delivery; stages: ItemStage[]; readOnly?: boolean }) {
  const { busy, run } = useAction();
  const confirm = useConfirm();
  const items = delivery.items;
  if (!items.length) return null;
  const prep = prepProgress(items);
  const load = loadProgress(items);
  const showLoad = stages.includes('loaded');
  const toggle = (it: DeliveryItem, stage: ItemStage) =>
    run(() => post(`/api/deliveries/${delivery.id}/items/${it.id}/stage`, { stage, value: !it[stage] }));
  const confirmAll = async (stage: ItemStage) => {
    const ok = await confirm({
      title: `Marcar todos como ${STAGE_LABEL[stage].toLowerCase()}s?`,
      message: `Confirme somente se você verificou fisicamente todos os ${items.length} itens desta entrega.`,
      confirmLabel: 'Confirmar todos',
    });
    if (ok) run(() => post(`/api/deliveries/${delivery.id}/items/confirm-all`, { stage }), 'Materiais atualizados.');
  };
  const prepIncomplete = prep.done < prep.total;
  return (
    <div className="stack">
      {stages.some((s) => s !== 'loaded') && (
        <div className="stack tight">
          <div className="row between">
            <span className="small strong">{progressText(prep, 'conferidos')}</span>
            {prep.done === prep.total ? <Badge tone="success" icon={<CheckCheck size={12} />}>Material pronto para entrega</Badge> : null}
          </div>
          <ProgressBar value={prep.done} max={prep.total} tone={prepIncomplete ? 'warning' : undefined} />
        </div>
      )}
      {showLoad && (
        <div className="stack tight">
          <span className="small strong">{progressText(load, 'carregados')}</span>
          <ProgressBar value={load.done} max={load.total} tone={load.done < load.total ? 'warning' : undefined} />
          {prepIncomplete && (
            <div className="banner tone-warning small">
              <AlertTriangle size={16} />
              <span>Atenção: há material ainda não conferido pelo depósito.</span>
            </div>
          )}
        </div>
      )}
      <div className="checklist">
        {items.map((it) => {
          const complete = stages.every((s) => it[s]);
          return (
            <div key={it.id} className={cx('check-row', complete && 'done')}>
              <div className="grow">
                <div className="small strong">{itemLine(it)}</div>
                <div className="tiny muted">
                  {[
                    it.package_count != null && `${it.package_count} volume(s)`,
                    it.weight_kg != null && `${it.weight_kg} kg`,
                    ...stages.filter((s) => it[s]).map((s) => `${STAGE_LABEL[s]} por ${it[`${s}_by_name` as const] ?? '—'} em ${formatDateTime(it[`${s}_at` as const])}`),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <div className="row">
                {stages.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="stage-btn"
                    aria-pressed={it[s]}
                    disabled={readOnly || busy}
                    onClick={() => toggle(it, s)}
                    aria-label={`${STAGE_LABEL[s]}: ${it.description}`}
                  >
                    {it[s] ? <Check size={15} /> : null}
                    {STAGE_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {!readOnly && (
        <div className="row wrap">
          {stages.map((s) => (
            <Button key={s} size="sm" icon={<CheckCheck size={15} />} disabled={busy || items.every((i) => i[s])} onClick={() => confirmAll(s)}>
              Confirmar todos — {STAGE_LABEL[s].toLowerCase()}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Agendamento rápido / reagendamento

interface DriverRow {
  id: number;
  name: string;
  active: boolean;
  day_count: number;
  day_periods: string | null;
  vehicle_name: string | null;
}

export function useDrivers(date?: string | null) {
  return useResource<{ drivers: DriverRow[] }>(`/api/drivers${date ? `?date=${date}` : ''}`);
}

export function ScheduleFields({
  value,
  onChange,
  errors = {},
}: {
  value: { delivery_date: string; delivery_period: string; scheduled_start_time: string; scheduled_end_time: string; driver_id: string };
  onChange: (patch: Partial<typeof value>) => void;
  errors?: FieldErrors;
}) {
  const { config } = useSession();
  const drivers = useDrivers(value.delivery_date || null);
  const list = drivers.data?.drivers ?? [];
  const selected = list.find((d) => String(d.id) === value.driver_id);
  const warnings: string[] = [];
  if (value.delivery_date && value.delivery_date < config.today) warnings.push('A data escolhida já passou.');
  if (selected && value.delivery_date) {
    const periods = (selected.day_periods ?? '').split(',').filter(Boolean);
    const others = selected.day_count;
    if (value.delivery_period && value.delivery_period !== 'a_definir') {
      const same = periods.filter((p) => p === value.delivery_period).length;
      if (same >= 1) warnings.push(`${selected.name} já tem ${same} entrega(s) de ${periodLabel(value.delivery_period).toLowerCase()} em ${formatDateBR(value.delivery_date)}.`);
    }
    if (others >= 8) warnings.push(`${selected.name} já tem ${others} entregas neste dia.`);
  }
  if (value.driver_id && !value.delivery_date) warnings.push('Entregador definido, mas sem data: a entrega continua aguardando agendamento.');
  return (
    <div className="form-grid">
      <Field className="span-3" label="Data da entrega" htmlFor="sch-date" error={errors.delivery_date} hint="Deixe em branco se ainda vai combinar com o cliente.">
        <div className="row">
          <input id="sch-date" type="date" className="input" value={value.delivery_date} onChange={(e) => onChange({ delivery_date: e.target.value })} aria-invalid={!!errors.delivery_date} />
          {value.delivery_date && (
            <Button size="sm" variant="ghost" onClick={() => onChange({ delivery_date: '', scheduled_start_time: '', scheduled_end_time: '' })}>
              Limpar
            </Button>
          )}
        </div>
        <div className="row wrap" style={{ marginTop: 6 }}>
          {[0, 1, 2].map((n) => {
            const d = addDays(config.today, n);
            return (
              <button key={n} type="button" className="chip" style={{ minHeight: 30 }} aria-pressed={value.delivery_date === d} onClick={() => onChange({ delivery_date: d })}>
                {n === 0 ? 'Hoje' : n === 1 ? 'Amanhã' : formatDateBR(d).slice(0, 5)}
              </button>
            );
          })}
        </div>
      </Field>
      <Field className="span-3" label="Período" htmlFor="sch-period" error={errors.delivery_period}>
        <select id="sch-period" className="select" value={value.delivery_period} onChange={(e) => onChange({ delivery_period: e.target.value })}>
          <option value="">Sem período definido</option>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      {(value.delivery_period === 'combinado' || value.scheduled_start_time || value.scheduled_end_time) && (
        <>
          <Field className="span-3" label="Início da janela" htmlFor="sch-start" error={errors.scheduled_start_time} hint="Somente se combinado com o cliente.">
            <input id="sch-start" type="time" className="input" value={value.scheduled_start_time} onChange={(e) => onChange({ scheduled_start_time: e.target.value })} />
          </Field>
          <Field className="span-3" label="Fim da janela" htmlFor="sch-end" error={errors.scheduled_end_time}>
            <input id="sch-end" type="time" className="input" value={value.scheduled_end_time} onChange={(e) => onChange({ scheduled_end_time: e.target.value })} />
          </Field>
        </>
      )}
      <Field className="span-6" label="Entregador ou motorista" htmlFor="sch-driver" error={errors.driver_id}>
        <select id="sch-driver" className="select" value={value.driver_id} onChange={(e) => onChange({ driver_id: e.target.value })}>
          <option value="">Sem entregador</option>
          {list
            .filter((d) => d.active || String(d.id) === value.driver_id)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
                {value.delivery_date ? ` — ${d.day_count} entrega(s) no dia` : ''}
                {!d.active ? ' (inativo)' : ''}
              </option>
            ))}
        </select>
      </Field>
      {warnings.length > 0 && (
        <div className="span-6 banner tone-warning small" role="status">
          <AlertTriangle size={16} />
          <div className="stack tight">
            {warnings.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function scheduleState(d?: Partial<Delivery> | null) {
  return {
    delivery_date: d?.delivery_date ?? '',
    delivery_period: d?.delivery_period ?? '',
    scheduled_start_time: d?.scheduled_start_time ?? '',
    scheduled_end_time: d?.scheduled_end_time ?? '',
    driver_id: d?.driver_id ? String(d.driver_id) : '',
  };
}

export function ScheduleDialog({ delivery, open, onClose }: { delivery: Delivery; open: boolean; onClose: () => void }) {
  const [value, setValue] = useState(scheduleState(delivery));
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) {
      setValue(scheduleState(delivery));
      setReason('');
      setErrors({});
    }
  }, [open, delivery]);
  const isReschedule = !!delivery.delivery_date;
  const submit = async () => {
    setBusy(true);
    try {
      await post(`/api/deliveries/${delivery.id}/schedule`, { ...value, reason, version: delivery.version });
      toast(isReschedule ? 'Entrega reagendada. A agenda anterior ficou no histórico.' : 'Entrega agendada.');
      invalidateAll();
      onClose();
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields);
      toast(e instanceof Error ? e.message : 'Erro ao agendar.', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReschedule ? 'Reagendar entrega' : 'Agendar entrega'}
      subtitle={delivery.customer_name}
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" loading={busy} onClick={submit} icon={<Truck size={16} />}>
            Salvar agendamento
          </Button>
        </>
      }
    >
      <div className="stack">
        <ScheduleFields value={value} onChange={(p) => setValue((v) => ({ ...v, ...p }))} errors={errors} />
        {isReschedule && (
          <Field label="Motivo (opcional)" htmlFor="sch-reason" hint="Fica registrado no histórico da entrega.">
            <input id="sch-reason" className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente pediu para mudar o dia" />
          </Field>
        )}
      </div>
    </Modal>
  );
}

export function MaterialsSummary({ delivery, max = 3 }: { delivery: Delivery; max?: number }): ReactNode {
  const items = delivery.items;
  if (!items.length && !delivery.materials_notes) return null;
  return (
    <div className="materials">
      {items.slice(0, max).map((i) => (
        <span key={i.id} className="truncate">
          {itemLine(i)}
        </span>
      ))}
      {items.length > max && <span className="muted tiny">+ {items.length - max} item(ns)</span>}
      {!items.length && delivery.materials_notes && <span style={{ whiteSpace: 'pre-line' }}>{delivery.materials_notes}</span>}
    </div>
  );
}
