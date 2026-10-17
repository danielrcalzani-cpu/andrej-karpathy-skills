"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { portrait, site } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";

/** Elementos que já oferecem contato; a barra some enquanto estão visíveis. */
const WATCH = ["hero-ctas", "contato", "site-footer"];

/**
 * Barra de contato fixa no rodapé da tela, só no celular. Aparece depois
 * que os botões do topo saem da tela e some perto da seção de contato e do
 * rodapé, para nunca cobrir os links finais.
 */
export function MobileWhatsApp() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const inView = new Set<string>();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) inView.add(e.target.id);
        else inView.delete(e.target.id);
      }
      setVisible(inView.size === 0);
    });
    WATCH.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <a
      href={whatsappLink("geral")}
      target="_blank"
      rel="noopener noreferrer"
      data-cta="mobile-whatsapp"
      data-intent="geral"
      aria-hidden={!visible}
      tabIndex={visible ? undefined : -1}
      className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-ivory/95 px-4 pt-3 shadow-[0_-8px_24px_rgb(42_23_48/0.12)] backdrop-blur-md transition-all duration-300 ease-soft md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-aubergine">
        {portrait.src && <Image src={portrait.src} alt="" fill sizes="44px" className="object-cover object-[50%_30%]" />}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate font-serif text-lg text-aubergine">{site.name}</span>
        <span className="block truncate text-xs text-muted">
          Corretora · {site.creci}
        </span>
      </span>
      <span className="inline-flex min-h-11 shrink-0 items-center gap-2 bg-aubergine px-4 text-sm font-semibold text-ivory">
        <FaWhatsapp aria-hidden="true" className="size-5 text-gold-light" />
        WhatsApp
      </span>
      <span className="sr-only"> — falar com Bianka (abre em nova aba)</span>
    </a>
  );
}
