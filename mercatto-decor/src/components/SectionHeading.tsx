import type { ReactNode } from "react";
import Reveal from "./Reveal";

type Props = {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: "light" | "dark";
  align?: "left" | "split";
  id?: string;
};

/** Cabeçalho editorial de seção: numeração, sobretítulo, título em serifa (itálico em cobre). */
export default function SectionHeading({ index, eyebrow, title, intro, tone = "light", align = "split", id }: Props) {
  const muted = tone === "dark" ? "text-paper/70" : "text-ink-soft";
  const eyebrowColor = tone === "dark" ? "text-copper-soft" : "text-copper-deep";
  return (
    <div className={align === "split" ? "grid gap-8 md:grid-cols-12 md:items-end" : "max-w-3xl"}>
      <Reveal className={align === "split" ? "md:col-span-7" : ""}>
        <p className={`eyebrow ${eyebrowColor} flex items-center gap-3`}>
          {index && <span className="font-serif text-sm tracking-normal">{index}</span>}
          {index && <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />}
          {eyebrow}
        </p>
        <h2 id={id} className="display mt-5 text-[2.35rem] sm:text-5xl lg:text-[3.6rem]">
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal delay={120} className={align === "split" ? "md:col-span-5 md:pb-2" : "mt-6"}>
          <p className={`max-w-md text-[0.95rem] leading-relaxed ${muted}`}>{intro}</p>
        </Reveal>
      )}
    </div>
  );
}
