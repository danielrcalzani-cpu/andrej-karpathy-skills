"use client";

import { useEffect, useState } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { whatsappLink } from "@/lib/whatsapp";

/** Elementos que já oferecem contato; o botão some enquanto estão visíveis. */
const WATCH = ["hero-ctas", "contato", "site-footer"];

/**
 * Atalho discreto de WhatsApp no celular. Aparece só depois que os botões
 * do topo saem da tela e se esconde perto da seção de contato e do rodapé,
 * para nunca cobrir os links finais.
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
      className={`fixed right-4 z-30 flex items-center gap-2 bg-aubergine py-3 pl-3.5 pr-4 text-sm font-semibold text-ivory shadow-[0_8px_24px_rgb(42_23_48/0.28)] transition-all duration-300 ease-soft md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
      style={{ bottom: "calc(1rem + env(safe-area-inset-bottom))" }}
    >
      <FaWhatsapp aria-hidden="true" className="size-5 text-gold-light" />
      WhatsApp
      <span className="sr-only"> — falar com Bianka (abre em nova aba)</span>
    </a>
  );
}
