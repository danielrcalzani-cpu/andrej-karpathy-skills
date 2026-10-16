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
  geral: "Olá, Bianka! Vim pelo seu site e gostaria de conversar.",
} as const;

export type WhatsAppIntent = keyof typeof whatsappMessages;

/** Monta o link wa.me com a mensagem codificada para URL. */
export function whatsappLink(
  intent: WhatsAppIntent = "geral",
  number: string = site.whatsappNumber,
): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(whatsappMessages[intent])}`;
}
