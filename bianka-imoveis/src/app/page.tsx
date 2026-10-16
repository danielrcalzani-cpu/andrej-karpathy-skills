import { About } from "@/components/About";
import { FinalCta } from "@/components/FinalCta";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { MobileWhatsApp } from "@/components/MobileWhatsApp";
import { Process } from "@/components/Process";
import { Listings } from "@/components/properties/Listings";
import { SoldProperties } from "@/components/properties/SoldProperties";
import { Services } from "@/components/Services";
import { copy, site } from "@/content/site";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: site.brand,
  description: copy.seo.description,
  url: site.url,
  telephone: `+${site.whatsappNumber}`,
  areaServed: { "@type": "City", name: site.city },
  address: {
    "@type": "PostalAddress",
    addressLocality: site.city,
    addressRegion: site.state,
    addressCountry: "BR",
  },
  sameAs: [site.instagramUrl],
  knowsAbout: site.services,
  employee: {
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    identifier: site.creci,
  },
};

export default function Home() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-aubergine focus:px-4 focus:py-3 focus:text-ivory"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo">
        <Hero />
        <About />
        <Listings />
        <SoldProperties />
        <Services />
        <Process />
        <FinalCta />
      </main>
      <Footer />
      <MobileWhatsApp />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
