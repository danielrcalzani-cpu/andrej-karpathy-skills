import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveStatus,
  formatPhone,
  googleMapsUrl,
  navigationQuery,
  normalizeWhatsApp,
  prepProgress,
  progressText,
  startOfWeek,
  todayISO,
  validateDelivery,
  wazeUrl,
  whatsappUrl,
  WHATSAPP_TEMPLATES,
} from '../shared/domain.ts';
import type { AddressFields, DeliveryItem } from '../shared/domain.ts';
import { parseDate, parseUrgency } from '../server/legacy.ts';

const emptyAddr: AddressFields = {
  postal_code: null,
  street: null,
  address_number: null,
  address_complement: null,
  neighborhood: null,
  city: null,
  state: null,
  reference_point: null,
  address_text: null,
};

test('normaliza WhatsApp brasileiro', () => {
  assert.equal(normalizeWhatsApp('(92) 99123-4567'), '5592991234567');
  assert.equal(normalizeWhatsApp('+55 92 99123 4567'), '5592991234567');
  assert.equal(normalizeWhatsApp('092991234567'), '5592991234567');
  assert.equal(normalizeWhatsApp('(92) 3234-5678'), '559232345678');
  assert.equal(normalizeWhatsApp('92 89123-4567'), null); // celular sem 9
  assert.equal(normalizeWhatsApp('12345'), null);
  assert.equal(normalizeWhatsApp(''), null);
  assert.equal(formatPhone('5592991234567'), '(92) 99123-4567');
});

test('link do WhatsApp leva mensagem codificada e recusa número inválido', () => {
  const msg = WHATSAPP_TEMPLATES[0]!.build({ customer_name: 'João Silva', order_number: '1045' });
  assert.match(msg, /^Olá, João! .*pedido nº 1045 está a caminho/);
  const url = whatsappUrl('(92) 99123-4567', msg)!;
  assert.ok(url.startsWith('https://wa.me/5592991234567?text='));
  assert.equal(decodeURIComponent(url.split('text=')[1]!), msg);
  assert.equal(whatsappUrl('abc', msg), null);
});

test('navegação usa só o endereço e trata endereço incompleto', () => {
  const full = { ...emptyAddr, street: 'Rua Exemplo', address_number: '123', neighborhood: 'Centro', city: 'Manaus', state: 'AM', postal_code: '69005000' };
  const q = navigationQuery(full)!;
  assert.equal(q, 'Rua Exemplo, 123, Centro, Manaus - AM, 69005-000, Brasil');
  assert.equal(googleMapsUrl(q), `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`);
  assert.equal(wazeUrl(q), `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`);
  assert.equal(navigationQuery({ ...emptyAddr, street: 'Rua Exemplo' }), null, 'sem cidade nem CEP');
  assert.ok(navigationQuery({ ...emptyAddr, street: 'Rua Exemplo' }, { city: 'Manaus', state: 'AM' })!.includes('Manaus'));
  assert.equal(navigationQuery({ ...emptyAddr, address_text: '123' }), null);
  assert.equal(navigationQuery({ ...emptyAddr, address_text: 'Av. Djalma Batista, 1000' }, { city: 'Manaus' }), 'Av. Djalma Batista, 1000, Manaus');
});

const item = (p: Partial<DeliveryItem>): DeliveryItem => ({
  description: 'x',
  quantity: 1,
  unit: 'caixas',
  package_count: null,
  weight_kg: null,
  prepared: false,
  checked: false,
  loaded: false,
  ...p,
});

test('progresso conta volumes; m² sem nº de volumes cai para contagem por itens', () => {
  const vols = prepProgress([item({ quantity: 12, prepared: true, checked: true }), item({ quantity: 6, unit: 'barras' })]);
  assert.deepEqual(vols, { done: 12, total: 18, unit: 'volumes' });
  assert.equal(progressText(vols, 'conferidos'), '12 de 18 volumes conferidos');
  const lines = prepProgress([item({ quantity: 30, unit: 'm²', prepared: true, checked: true }), item({ quantity: 4 })]);
  assert.deepEqual(lines, { done: 1, total: 2, unit: 'itens' });
  const pkg = prepProgress([item({ quantity: 30, unit: 'm²', package_count: 3 })]);
  assert.deepEqual(pkg, { done: 0, total: 3, unit: 'volumes' });
});

test('situação derivada segue as regras de agendamento e preparo', () => {
  const base = { exec_status: 'pendente' as const, delivery_date: null, items: [], material_separated: false };
  assert.equal(deriveStatus(base), 'aguardando_agendamento');
  assert.equal(deriveStatus({ ...base, material_separated: true }), 'aguardando_agendamento');
  assert.equal(deriveStatus({ ...base, delivery_date: '2026-10-30' }), 'aguardando_separacao');
  assert.equal(deriveStatus({ ...base, delivery_date: '2026-10-30', material_separated: true }), 'pronta');
  // Com itens, o flag não basta: todos precisam estar separados e conferidos.
  assert.equal(deriveStatus({ ...base, delivery_date: '2026-10-30', material_separated: true, items: [{ prepared: true, checked: false }] }), 'aguardando_separacao');
  assert.equal(deriveStatus({ ...base, delivery_date: '2026-10-30', items: [{ prepared: true, checked: false }], prep_exception_reason: 'ok' }), 'pronta');
  assert.equal(deriveStatus({ ...base, exec_status: 'problema' }), 'problema');
});

test('validação de horários e datas', () => {
  const { errors } = validateDelivery({ customer_name: 'A', street: 'Rua', scheduled_start_time: '14:00', scheduled_end_time: '13:00' });
  assert.ok(errors.scheduled_end_time);
  assert.ok(errors.delivery_date, 'horário exige data');
  assert.ok(validateDelivery({ customer_name: 'A', street: 'Rua', delivery_date: '2026-02-30' }).errors.delivery_date);
});

test('datas no fuso de Manaus e início da semana', () => {
  assert.equal(todayISO('America/Manaus', new Date('2026-10-31T02:00:00Z')), '2026-10-30');
  assert.equal(startOfWeek('2026-11-01'), '2026-10-26'); // domingo -> segunda anterior
  assert.equal(startOfWeek('2026-10-26'), '2026-10-26');
});

test('importação: datas e urgência da agenda antiga', () => {
  assert.equal(parseDate('05/11/2026'), '2026-11-05');
  assert.equal(parseDate('5/1/26'), '2026-01-05');
  assert.equal(parseDate('2026-11-05T10:00:00Z'), '2026-11-05');
  assert.equal(parseDate('amanhã'), null);
  assert.equal(parseUrgency('Vermelho'), 'alta');
  assert.equal(parseUrgency('amarelo'), 'media');
  assert.equal(parseUrgency(''), null);
  assert.equal(parseUrgency(false), null);
});
