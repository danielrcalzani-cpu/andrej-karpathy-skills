"use client";

import { useEffect, useRef, useState } from "react";
import { LuMenu, LuX } from "react-icons/lu";
import { copy } from "@/content/site";
import { CtaLink } from "./CtaLink";
import { Wordmark } from "./Wordmark";

export function Header() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const links = copy.nav;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ivory/92 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20">
        <a href="#inicio" aria-label="Bianka Rodrigues Imóveis — início" className="shrink-0 py-1">
          <Wordmark />
        </a>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="relative py-2 text-[0.92rem] font-medium text-charcoal/85 transition-colors hover:text-aubergine after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden sm:block">
            <CtaLink ctaId="header-whatsapp" intent="geral" icon className="!px-5 !py-2.5 text-[0.88rem]">
              {copy.headerCta}
            </CtaLink>
          </span>
          <button
            ref={toggleRef}
            type="button"
            className="-mr-2 inline-flex size-11 items-center justify-center text-aubergine lg:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <LuX aria-hidden="true" className="size-6" /> : <LuMenu aria-hidden="true" className="size-6" />}
            <span className="sr-only">{open ? "Fechar menu" : "Abrir menu"}</span>
          </button>
        </div>
      </div>

      <nav
        id="menu-mobile"
        aria-label="Menu"
        hidden={!open}
        className="border-t border-line/70 bg-ivory lg:hidden"
      >
        <ul className="mx-auto max-w-7xl px-5 py-3 sm:px-8">
          {links.map((l) => (
            <li key={l.href} className="border-b border-line/60 last:border-0">
              <a
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-4 font-serif text-2xl text-aubergine"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mx-auto max-w-7xl px-5 pb-6 sm:px-8">
          <CtaLink ctaId="menu-whatsapp" intent="geral" icon className="w-full">
            {copy.headerCta}
          </CtaLink>
        </div>
      </nav>
    </header>
  );
}
