import type { PortfolioItem, PortfolioPhoto, PortfolioVideo } from "@/content/portfolio";

export type Slide =
  | { kind: "photo"; photo: PortfolioPhoto }
  | { kind: "video"; video: PortfolioVideo };

/** Fotos primeiro, vídeo (se houver) por último. */
export function getSlides(item: PortfolioItem): Slide[] {
  const slides: Slide[] = item.photos.map((photo) => ({ kind: "photo", photo }));
  if (item.video) slides.push({ kind: "video", video: item.video });
  return slides;
}

export function itemTitle(item: PortfolioItem): string {
  return item.title ?? item.propertyType ?? "Imóvel vendido";
}

export function itemMeta(item: PortfolioItem): string {
  return [item.propertyType, item.neighborhood].filter(Boolean).join(" · ");
}
