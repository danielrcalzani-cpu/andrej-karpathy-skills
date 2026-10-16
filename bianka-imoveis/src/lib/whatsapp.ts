import { statusLabel, type Property } from "@/content/properties";
import { site } from "@/content/site";

/** Mensagens pré-preenchidas por intenção do visitante. */
export const whatsappMessages = {
  comprar:
    "Olá, Bianka! Vim pelo seu site e gostaria de encontrar um imóvel em Manaus.",
  vender:
    "Olá, Bianka! Vim pelo seu site e gostaria de conversar sobre a venda do meu imóvel.",
  anunciar:
    "Olá, Bianka! Vim pelo seu site e gostaria de conversar sobre vender ou alugar o meu imóvel.",
  locacao:
    "Olá, Bianka! Vim pelo seu site e gostaria de conversar sobre locação de imóveis.",
  avaliacao:
    "Olá, Bianka! Vim pelo seu site e gostaria de solicitar uma avaliação do meu imóvel.",
  portfolio:
    "Olá, Bianka! Vi os imóveis vendidos no seu site e gostaria de encontrar opções semelhantes.",
  imoveis:
    "Olá, Bianka! Vim pelo seu site e gostaria de saber quais imóveis você tem disponíveis no momento.",
  geral: "Olá, Bianka! Vim pelo seu site e gostaria de conversar.",
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

function link(message: string, number: string = site.whatsappNumber): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Monta o link wa.me com a mensagem codificada para URL. */
export function whatsappLink(intent: WhatsAppIntent = "geral"): string {
  return link(whatsappMessages[intent]);
}

/** Mensagem que identifica o imóvel (título, situação, bairro e código). */
export function propertyMessage(p: Property): string {
  const title = p.title ?? p.propertyType ?? "imóvel";
  const where = p.neighborhood ? `, no bairro ${p.neighborhood}` : "";
  return `Olá, Bianka! Vim pelo seu site e tenho interesse no imóvel "${title}" (${statusLabel[p.status].toLowerCase()}${where}, código ${p.id}). Pode me passar mais informações?`;
}

export function propertyWhatsappLink(p: Property): string {
  return link(propertyMessage(p));
}
