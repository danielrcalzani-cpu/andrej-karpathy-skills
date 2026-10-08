"use client";

import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import { WhatsAppIcon, InstagramIcon } from "./Icons";
import { nav, site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled && !open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,color] duration-500 ${
        solid ? "bg-paper/95 text-ink shadow-[0_1px_0_rgba(43,39,36,0.08)] backdrop-blur" : "bg-transparent text-white"
      }`}
    >
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-paper focus:px-4 focus:py-2 focus:text-ink"
      >
        Pular para o conteúdo
      </a>
      <div className={`container-x flex items-center justify-between transition-[height] duration-500 ${solid ? "h-[4.5rem]" : "h-20 md:h-24"}`}>
        <a href="#topo" aria-label="Mercatto Decor — início" className="relative z-[51] shrink-0">
          <Logo variant={solid ? "dark" : "light"} className={`w-auto transition-[height] duration-500 ${solid ? "h-11" : "h-12 md:h-14"}`} />
        </a>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8 xl:gap-10">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="link-line pb-1 text-[0.8rem] font-medium tracking-[0.08em]">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn hidden min-h-11 px-5 py-2.5 sm:inline-flex ${solid ? "btn-ink" : "btn-ghost-light"}`}
          >
            <WhatsAppIcon className="h-4 w-4" />
            Solicitar orçamento
          </a>
          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            className="relative z-[51] -mr-2 inline-flex h-11 w-11 items-center justify-center lg:hidden"
          >
            {open ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile em tela cheia */}
      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!open}
        className="fixed inset-0 z-50 overflow-y-auto bg-night text-paper lg:hidden"
      >
        <div className="container-x flex min-h-full flex-col pb-10 pt-28">
          <nav aria-label="Menu mobile">
            <ul className="border-t border-white/10">
              {nav.map((item, i) => (
                <li key={item.href} className="border-b border-white/10">
                  <a
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 font-serif text-[1.9rem] leading-tight"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-5 pt-10">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-copper w-full">
              <WhatsAppIcon className="h-4 w-4" />
              Solicitar orçamento
            </a>
            <div className="flex items-center justify-between text-sm text-paper/70">
              <span>{site.whatsapp.display}</span>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2">
                <InstagramIcon className="h-4 w-4" />
                {site.instagram.handle}
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
