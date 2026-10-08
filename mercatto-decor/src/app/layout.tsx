import type { Metadata, Viewport } from "next";
import { Lora, Poppins } from "next/font/google";
import { site } from "@/data/site";
import "./globals.css";

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
  variable: "--font-lora",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-poppins",
  display: "swap",
});

const description =
  "Pisos vinílicos, placas de revestimento flexível, revestimento de parede Château Mur e teto laminado em Manaus. Efeitos de madeira, mármore, pedra e linho com instalação prática. Solicite seu orçamento.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Mercatto Decor | Pisos e Revestimentos em Manaus",
    template: "%s | Mercatto Decor",
  },
  description,
  keywords: [
    "pisos em Manaus",
    "pisos vinílicos Manaus",
    "revestimentos Manaus",
    "revestimento de parede",
    "placas decorativas",
    "revestimento vinílico",
    "teto laminado",
    "acabamentos",
    "Mercatto Decor",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: site.name,
    title: "Mercatto Decor | Pisos e Revestimentos em Manaus",
    description,
    images: [
      {
        url: "/projects/teto-recepcao.jpg",
        width: 1448,
        height: 1086,
        alt: "Recepção com teto laminado em madeira — Mercatto Decor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mercatto Decor | Pisos e Revestimentos em Manaus",
    description,
    images: ["/projects/teto-recepcao.jpg"],
  },
  icons: { icon: "/brand/logo-mercatto-decor.png", apple: "/brand/logo-mercatto-decor.png" },
};

export const viewport: Viewport = {
  themeColor: "#2b2724",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HomeAndConstructionBusiness",
  name: site.name,
  description,
  url: site.url,
  logo: `${site.url}/brand/logo-mercatto-decor.png`,
  image: `${site.url}/projects/teto-recepcao.jpg`,
  telephone: "+55-92-98288-4949",
  email: site.email,
  address: {
    "@type": "PostalAddress",
    streetAddress: `${site.address.street}, ${site.address.district}`,
    addressLocality: site.address.city,
    addressRegion: site.address.state,
    addressCountry: site.address.country,
  },
  areaServed: { "@type": "City", name: "Manaus" },
  sameAs: [site.instagram.url],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${lora.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        {/* Marca a página como "com JS" antes da pintura, para as animações de revelação. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
