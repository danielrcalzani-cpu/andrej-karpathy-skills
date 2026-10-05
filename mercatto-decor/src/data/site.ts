// Dados institucionais. Fonte: briefing + rodapé/contato dos catálogos Mercatto Decor (edição 2026).

export const site = {
  name: "Mercatto Decor",
  // TODO(dev): definir o domínio definitivo via NEXT_PUBLIC_SITE_URL.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  tagline: "Realizamos sua transformação.",
  whatsapp: {
    display: "(92) 98288-4949",
    number: "5592982884949",
  },
  email: "mercattodecor@gmail.com",
  instagram: {
    handle: "@mercatto.decor",
    url: "https://www.instagram.com/mercatto.decor/",
    // Conforme o perfil do Instagram (captura enviada em out/2026). Atualizar quando mudar.
    followers: "26 mil",
  },
  address: {
    street: "Av. Coronel Teixeira, nº 04 – Quadra B",
    district: "Conjunto Cophasa",
    city: "Manaus",
    state: "AM",
    country: "BR",
  },
} as const;

export const nav = [
  { label: "Produtos", href: "#produtos" },
  { label: "Ambientes", href: "#ambientes" },
  { label: "Inspirações", href: "#inspiracoes" },
  { label: "Catálogos", href: "#catalogos" },
  { label: "Sobre", href: "#sobre" },
  { label: "Contato", href: "#contato" },
] as const;
