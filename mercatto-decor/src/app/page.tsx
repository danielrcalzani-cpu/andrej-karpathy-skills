import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FactsBand from "@/components/FactsBand";
import IntroStatement from "@/components/IntroStatement";
import ProductUniverse from "@/components/ProductUniverse";
import ProductDiscovery from "@/components/ProductDiscovery";
import TextureGallery from "@/components/TextureGallery";
import BenefitsSection from "@/components/BenefitsSection";
import ApplicationGallery from "@/components/ApplicationGallery";
import FeaturedCollection from "@/components/FeaturedCollection";
import HowItWorks from "@/components/HowItWorks";
import TechnicalSpecs from "@/components/TechnicalSpecs";
import CatalogSection from "@/components/CatalogSection";
import InspirationGallery from "@/components/InspirationGallery";
import AboutSection from "@/components/AboutSection";
import InstagramSection from "@/components/InstagramSection";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FactsBand />
        <IntroStatement />
        <ProductUniverse />
        <ProductDiscovery />
        <TextureGallery />
        <BenefitsSection />
        <ApplicationGallery />
        <FeaturedCollection />
        <HowItWorks />
        <TechnicalSpecs />
        <CatalogSection />
        <InspirationGallery />
        <AboutSection />
        <InstagramSection />
        <FinalCTA />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
