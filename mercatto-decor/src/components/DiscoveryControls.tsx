"use client";

import { useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Melhorias onde há JavaScript: setas do carrossel e links "Explorar coleção" (#colecoes-<linha>). */
export default function DiscoveryControls() {
  useEffect(() => {
    const fromHash = () => {
      const m = window.location.hash.match(/^#colecoes-(.+)$/);
      const radio = m && document.getElementById(`disc-t-${m[1]}`);
      if (radio instanceof HTMLInputElement) {
        radio.checked = true;
        document.getElementById("colecoes")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const track = [...document.querySelectorAll<HTMLElement>("#colecoes .disc-track")].find((t) => t.offsetParent !== null);
    track?.scrollBy({ left: dir * track.clientWidth * 0.85, behavior: "smooth" });
  };

  const btn =
    "inline-flex h-11 w-11 items-center justify-center border border-ink/25 transition-colors hover:bg-ink hover:text-paper";
  return (
    <div className="js-only hidden gap-2 pb-3 md:flex">
      <button type="button" onClick={() => scrollBy(-1)} aria-label="Padrões anteriores" className={btn}>
        <ArrowLeft className="h-4 w-4" />
      </button>
      <button type="button" onClick={() => scrollBy(1)} aria-label="Próximos padrões" className={btn}>
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
