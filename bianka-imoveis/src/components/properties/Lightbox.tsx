"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { LuChevronLeft, LuChevronRight, LuPlay, LuX } from "react-icons/lu";
import type { Property, PropertyVideo } from "@/content/properties";
import { copy } from "@/content/site";
import { CtaLink } from "../CtaLink";
import { propertyWhatsappLink } from "@/lib/whatsapp";
import { getSlides, itemDetails, itemTitle, type Slide } from "./media";
import { Badges } from "./StatusBadge";

const FOCUSABLE =
  'a[href], button:not([disabled]), video[controls], iframe, [tabindex]:not([tabindex="-1"])';

/** Encaixa a mídia no palco sem distorcer, seja vertical ou horizontal. */
function fitStyle(width: number, height: number) {
  return {
    aspectRatio: `${width} / ${height}`,
    width: `min(100cqw, calc(100cqh * ${width / height}))`,
  };
}

function embedUrl(video: Exclude<PropertyVideo, { type: "file" }>) {
  return video.type === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.id)}?autoplay=1&rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${encodeURIComponent(video.id)}?autoplay=1&dnt=1`;
}

function VideoSlide({ video, title }: { video: PropertyVideo; title: string }) {
  const [playing, setPlaying] = useState(false);

  if (video.type === "file") {
    return (
      <video
        controls
        playsInline
        preload="none"
        poster={video.poster}
        width={video.width}
        height={video.height}
        style={fitStyle(video.width, video.height)}
        className="h-auto max-w-none bg-black"
        aria-label={`Vídeo: ${title}`}
      >
        {video.srcWebm && <source src={video.srcWebm} type="video/webm" />}
        <source src={video.src} type="video/mp4" />
        Seu navegador não reproduz vídeos.{" "}
        <a href={video.src} className="underline">Baixar o vídeo</a>.
      </video>
    );
  }

  return (
    <div style={fitStyle(video.width, video.height)} className="relative bg-black">
      {playing ? (
        <iframe
          src={embedUrl(video)}
          title={`Vídeo: ${title}`}
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 flex items-center justify-center"
        >
          <Image src={video.poster} alt="" fill sizes="100vw" className="object-cover" />
          <span className="relative flex size-20 items-center justify-center rounded-full bg-ivory/95 text-aubergine shadow-lg transition-transform duration-300 group-hover:scale-105">
            <LuPlay aria-hidden="true" className="ml-1 size-8" />
          </span>
          <span className="sr-only">Reproduzir vídeo: {title}</span>
        </button>
      )}
    </div>
  );
}

function SlideView({ slide, title }: { slide: Slide; title: string }) {
  if (slide.kind === "photo") {
    return (
      <div className="relative size-full">
        <Image
          src={slide.photo.src}
          alt={slide.photo.alt}
          fill
          sizes="(min-width: 1024px) calc(100vw - 24rem), 100vw"
          className="object-contain"
        />
      </div>
    );
  }
  return <VideoSlide video={slide.video} title={title} />;
}

type Props = { item: Property; startIndex: number; onClose: () => void };

export function Lightbox({ item, startIndex, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const slides = getSlides(item);
  const [index, setIndex] = useState(startIndex);
  const slide = slides[index];
  const title = itemTitle(item);
  const sold = item.status === "vendido";
  const total = slides.length;

  const go = useCallback((delta: number) => setIndex((i) => (i + delta + total) % total), [total]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;

    dialog.showModal();
    html.style.overflow = "hidden";

    return () => {
      html.style.overflow = prevOverflow;
      if (dialog.open) dialog.close();
      previous?.focus();
    };
  }, []);

  function onKeyDown(e: KeyboardEvent<HTMLDialogElement>) {
    const target = e.target as HTMLElement;
    const inMedia = target.tagName === "VIDEO";

    if (e.key === "ArrowRight" && !inMedia && total > 1) {
      e.preventDefault();
      go(1);
    } else if (e.key === "ArrowLeft" && !inMedia && total > 1) {
      e.preventDefault();
      go(-1);
    } else if (e.key === "Tab") {
      // Mantém o foco dentro do modal.
      const nodes = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
      ).filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const label = (s: Slide, i: number) =>
    s.kind === "video" ? "Vídeo tour" : `Foto ${i + 1} de ${item.photos.length}`;

  const navBtn =
    "absolute top-1/2 z-10 flex size-11 -translate-y-1/2 items-center justify-center bg-ivory/90 text-aubergine transition-colors hover:bg-ivory sm:size-12";

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="lightbox-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onKeyDown={onKeyDown}
      className="on-dark fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden bg-[#1d1021] p-0 text-ivory"
    >
      <div className="flex h-full flex-col lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-4 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
            <p aria-live="polite" className="text-xs font-semibold uppercase tracking-[0.2em] text-ivory/75">
              {label(slide, index)}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex size-11 items-center justify-center text-ivory transition-colors hover:text-gold-light"
            >
              <LuX aria-hidden="true" className="size-6" />
              <span className="sr-only">Fechar galeria</span>
            </button>
          </div>

          <div className="relative min-h-0 flex-1 px-3 sm:px-16">
            <div className="flex size-full items-center justify-center [container-type:size]">
              <SlideView key={index} slide={slide} title={title} />
            </div>
            {total > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className={`${navBtn} left-2 sm:left-3`}>
                  <LuChevronLeft aria-hidden="true" className="size-6" />
                  <span className="sr-only">Mídia anterior</span>
                </button>
                <button type="button" onClick={() => go(1)} className={`${navBtn} right-2 sm:right-3`}>
                  <LuChevronRight aria-hidden="true" className="size-6" />
                  <span className="sr-only">Próxima mídia</span>
                </button>
              </>
            )}
          </div>

          {total > 1 && (
            <ul className="flex shrink-0 gap-2 overflow-x-auto px-4 py-3 sm:justify-center sm:px-6">
              {slides.map((s, i) => {
                const src = s.kind === "photo" ? s.photo.src : s.video.poster;
                return (
                  <li key={i} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-current={i === index ? "true" : undefined}
                      className={`relative block size-14 overflow-hidden border transition-opacity sm:size-16 ${
                        i === index ? "border-gold-light opacity-100" : "border-transparent opacity-55 hover:opacity-90"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="64px" className="object-cover" />
                      {s.kind === "video" && (
                        <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <LuPlay className="size-5 text-ivory" />
                        </span>
                      )}
                      <span className="sr-only">Mostrar {label(s, i).toLowerCase()}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="max-h-[34dvh] shrink-0 overflow-y-auto border-t border-ivory/10 bg-aubergine-deep px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-6 lg:max-h-none lg:w-[24rem] lg:border-l lg:border-t-0 lg:px-8 lg:pt-16">
          <Badges item={item} />
          <h2 id="lightbox-title" className="mt-4 font-serif text-3xl font-normal leading-tight text-ivory">
            {title}
          </h2>
          {item.isDemo && (
            <p className="mt-3 text-sm text-ivory/75">
              Item de demonstração. As imagens não representam um imóvel real.
            </p>
          )}
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 border-t border-ivory/10 pt-5 text-sm">
            {itemDetails(item).map((d) => (
              <div key={d.label} className="contents">
                <dt className="text-xs font-semibold uppercase leading-5 tracking-[0.14em] text-gold-light">{d.label}</dt>
                <dd className={d.missing ? "italic text-ivory/65" : "text-ivory"}>{d.value}</dd>
              </div>
            ))}
          </dl>
          {item.description && <p className="mt-4 leading-relaxed text-ivory/85">{item.description}</p>}
          {item.specs && item.specs.length > 0 && (
            <ul className="mt-5 space-y-2 border-t border-ivory/10 pt-5 text-sm text-ivory/85">
              {item.specs.map((s) => (
                <li key={s}>
                  {s}
                </li>
              ))}
            </ul>
          )}
          <div className="sticky bottom-0 mt-6 bg-aubergine-deep pt-2 shadow-[0_-16px_16px_var(--color-aubergine-deep)]">
            {sold ? (
              <CtaLink ctaId="lightbox-vendido" intent="portfolio" variant="light" icon className="w-full !px-5 !py-3.5 text-[0.9rem]">
                {copy.sold.cta}
              </CtaLink>
            ) : (
              <CtaLink
                ctaId={`lightbox-interesse-${item.id}`}
                href={propertyWhatsappLink(item)}
                variant="light"
                icon
                className="w-full !px-5 !py-3.5 text-[0.9rem]"
              >
                {copy.listings.cta}
              </CtaLink>
            )}
          </div>
        </aside>
      </div>
    </dialog>
  );
}
