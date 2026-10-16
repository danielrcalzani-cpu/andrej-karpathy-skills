import type { Metadata, Viewport } from "next";
import { EB_Garamond, Manrope } from "next/font/google";
import { copy, site } from "@/content/site";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: copy.seo.title,
  description: copy.seo.description,
  applicationName: site.brand,
  authors: [{ name: site.name }],
  keywords: [
    "corretora de imóveis em Manaus",
    "imóveis em Manaus",
    "comprar imóvel Manaus",
    "vender imóvel Manaus",
    "locação Manaus",
    "avaliação de imóveis Manaus",
    site.name,
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: site.brand,
    title: copy.seo.title,
    description: copy.seo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: copy.seo.title,
    description: copy.seo.description,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#3a2140",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${garamond.variable} ${manrope.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
