import type { Property, PropertyPhoto, PropertyVideo } from "@/content/properties";
import { copy } from "@/content/site";

export type Slide =
  | { kind: "photo"; photo: PropertyPhoto }
  | { kind: "video"; video: PropertyVideo };

/** Fotos primeiro, vídeo (se houver) por último. */
export function getSlides(item: Property): Slide[] {
  const slides: Slide[] = item.photos.map((photo) => ({ kind: "photo", photo }));
  if (item.video) slides.push({ kind: "video", video: item.video });
  return slides;
}

export function itemTitle(item: Property): string {
  return item.title ?? item.propertyType ?? "Imóvel";
}

export type Detail = { label: string; value: string; missing: boolean };

/**
 * Tipo, bairro e (para imóveis disponíveis) valor. Campos vazios viram
 * textos de "a confirmar" em vez de informações inventadas.
 */
export function itemDetails(item: Property): Detail[] {
  const { listings } = copy;
  const d = (label: string, value: string | undefined, placeholder: string): Detail => ({
    label,
    value: value ?? placeholder,
    missing: !value,
  });
  const details = [
    d("Tipo", item.propertyType, listings.typePlaceholder),
    d("Bairro", item.neighborhood, listings.neighborhoodPlaceholder),
  ];
  if (item.status !== "vendido") details.push(d("Valor", item.price, listings.pricePlaceholder));
  return details;
}
