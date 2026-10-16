import type { ReactNode } from "react";
import { FaWhatsapp } from "react-icons/fa6";
import { whatsappLink, type WhatsAppIntent } from "@/lib/whatsapp";

type Variant = "primary" | "secondary" | "light" | "outline-light" | "text";

const styles: Record<Variant, string> = {
  primary:
    "bg-aubergine text-ivory hover:bg-aubergine-deep px-6 py-3.5 shadow-[0_1px_0_rgb(0_0_0/0.08)]",
  secondary:
    "border border-aubergine/35 text-aubergine hover:border-aubergine hover:bg-aubergine/[0.04] px-6 py-3.5",
  light: "bg-gold-light text-aubergine-deep hover:bg-ivory px-7 py-4",
  "outline-light":
    "border border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory/[0.06] px-6 py-3.5",
  text: "min-h-11 text-aubergine underline decoration-gold decoration-1 underline-offset-[6px] hover:decoration-aubergine",
};

type Props = {
  /** Identificador estável para futuras métricas (ex.: hero-comprar). */
  ctaId: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
  icon?: boolean;
} & ({ intent: WhatsAppIntent; href?: never } | { href: string; intent?: never });

/**
 * Link de ação. Com `intent`, abre o WhatsApp com a mensagem correspondente.
 * Os atributos data-cta / data-intent permitem plugar analytics no futuro
 * sem alterar os componentes.
 */
export function CtaLink({
  ctaId,
  intent,
  href,
  variant = "primary",
  className = "",
  icon = false,
  children,
}: Props) {
  const url = intent ? whatsappLink(intent) : href!;
  const external = url.startsWith("http");

  return (
    <a
      href={url}
      data-cta={ctaId}
      data-intent={intent}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`group inline-flex items-center justify-center gap-2.5 text-[0.95rem] font-semibold tracking-[0.01em] transition-colors duration-300 ease-soft ${styles[variant]} ${className}`}
    >
      {icon && <FaWhatsapp aria-hidden="true" className="size-[1.1rem] shrink-0" />}
      <span>{children}</span>
      {external && <span className="sr-only"> (abre em nova aba)</span>}
    </a>
  );
}
