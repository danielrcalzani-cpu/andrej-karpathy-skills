import Image from "next/image";
import { portrait, site } from "@/content/site";

/** Retrato da Bianka, ou um monograma elegante enquanto não houver foto. */
export function Portrait({ sizes, priority = false }: { sizes: string; priority?: boolean }) {
  if (portrait.src) {
    return (
      <Image
        src={portrait.src}
        alt={portrait.alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover object-[50%_30%]"
      />
    );
  }

  return (
    <div
      role="img"
      aria-label="Espaço reservado para o retrato de Bianka Rodrigues"
      className="absolute inset-0 flex flex-col items-center justify-center bg-aubergine"
    >
      <svg aria-hidden="true" viewBox="0 0 200 250" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="#d9bf8c" strokeOpacity="0.35" strokeWidth="0.6">
          <path d="M40 250V110a60 60 0 0 1 120 0v140" />
          <path d="M52 250V112a48 48 0 0 1 96 0v138" strokeOpacity="0.2" />
        </g>
      </svg>
      <span
        aria-hidden="true"
        className="relative font-serif text-4xl italic leading-none text-gold-light sm:text-5xl lg:text-[7rem]"
      >
        BR
      </span>
      <span aria-hidden="true" className="relative mt-4 hidden text-xs font-semibold uppercase tracking-[0.4em] text-ivory/70 lg:block">
        {site.city} · {site.state}
      </span>
    </div>
  );
}
