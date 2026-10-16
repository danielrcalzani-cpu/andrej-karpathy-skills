import { site } from "@/content/site";

type Props = {
  tone?: "dark" | "light";
  className?: string;
};

/** Assinatura tipográfica: "Bianka Rodrigues" com o descritor IMÓVEIS. */
export function Wordmark({ tone = "dark", className = "" }: Props) {
  const main = tone === "dark" ? "text-aubergine" : "text-ivory";
  const sub = tone === "dark" ? "text-gold-ink" : "text-gold-light";

  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className={`font-serif text-[1.6rem] font-normal tracking-[-0.01em] ${main}`}>
        Bianka <span className="italic">Rodrigues</span>
      </span>
      <span className={`mt-1.5 flex items-center gap-2 ${sub}`}>
        <span aria-hidden="true" className="h-px w-6 bg-current opacity-70" />
        <span className="text-[0.7rem] font-semibold uppercase tracking-[0.4em]">
          {site.descriptor}
        </span>
      </span>
    </span>
  );
}
