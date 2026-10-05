"use client";

import { useEffect, useState } from "react";
import { WhatsAppIcon } from "./Icons";
import { whatsappUrl } from "@/lib/whatsapp";

/** Botão flutuante: aparece depois do hero, para não cobrir os botões de chamada. */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a Mercatto Decor no WhatsApp"
      tabIndex={visible ? undefined : -1}
      aria-hidden={!visible}
      className={`group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 flex h-12 items-center gap-3 rounded-full bg-[#1f8f4e] px-3.5 text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)] transition-[opacity,transform,padding,background-color] duration-500 hover:bg-[#187a42] md:bottom-8 md:right-8 md:h-14 md:px-4 md:hover:pr-6 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-500 group-hover:max-w-48 md:inline">
        Falar no WhatsApp
      </span>
    </a>
  );
}
