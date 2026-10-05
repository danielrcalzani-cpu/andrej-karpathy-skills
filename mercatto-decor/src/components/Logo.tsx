import Image from "next/image";

/** Logo oficial (extraído dos catálogos). Variante "light" para fundos escuros. */
export default function Logo({ variant = "dark", className = "h-12 w-auto" }: { variant?: "dark" | "light"; className?: string }) {
  return (
    <Image
      src={variant === "light" ? "/brand/logo-mercatto-decor-claro.png" : "/brand/logo-mercatto-decor.png"}
      alt="Mercatto Decor"
      width={543}
      height={603}
      className={className}
      priority
    />
  );
}
