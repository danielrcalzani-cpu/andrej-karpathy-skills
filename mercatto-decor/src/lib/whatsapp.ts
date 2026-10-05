import { site } from "@/data/site";

export const GENERAL_MESSAGE =
  "Olá! Conheci a Mercatto Decor pelo site e gostaria de conhecer os produtos e solicitar um orçamento.";

export function whatsappUrl(message: string = GENERAL_MESSAGE): string {
  return `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;
}

export function productMessage(productLabel: string): string {
  return `Olá! Vi o produto ${productLabel} no site da Mercatto Decor e gostaria de solicitar mais informações e orçamento.`;
}
