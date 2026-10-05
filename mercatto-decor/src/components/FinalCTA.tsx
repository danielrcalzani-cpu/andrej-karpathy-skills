import Image from "next/image";
import { Mail, MapPin } from "lucide-react";
import Reveal from "./Reveal";
import { InstagramIcon, WhatsAppIcon } from "./Icons";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export default function FinalCTA() {
  return (
    <section id="contato" aria-labelledby="cta-title" className="relative isolate overflow-hidden bg-night text-paper">
      <Image
        src="/projects/teto-07-sala-de-jantar.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[50%_35%]"
      />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(31,27,24,0.45)_0%,rgba(31,27,24,0.7)_55%,rgba(31,27,24,0.95)_100%)]" />

      <div className="container-x flex min-h-[90svh] flex-col justify-end pb-14 pt-40">
        <Reveal>
          <p className="eyebrow text-copper-soft">Orçamento</p>
          <h2 id="cta-title" className="display mt-5 max-w-5xl text-[2.7rem] sm:text-6xl lg:text-[5.2rem]">
            Seu próximo ambiente começa pela <em className="text-copper-soft">superfície.</em>
          </h2>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-paper/85 md:text-lg">
            Conte para a nossa equipe qual ambiente você quer transformar. A gente ajuda a escolher o padrão, calcular a quantidade e
            fechar o orçamento.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-copper">
              <WhatsAppIcon className="h-4 w-4" />
              Solicitar orçamento
            </a>
            <a href="#catalogos" className="btn btn-ghost-light">
              Ver catálogos
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="mt-16 grid gap-6 border-t border-white/20 pt-8 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3">
            <WhatsAppIcon className="mt-0.5 h-4 w-4 text-copper-soft" />
            <span>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-paper/60">WhatsApp</span>
              <span className="link-line">{site.whatsapp.display}</span>
            </span>
          </a>
          <a href={`mailto:${site.email}`} className="group flex items-start gap-3">
            <Mail className="mt-0.5 h-4 w-4 text-copper-soft" aria-hidden="true" />
            <span>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-paper/60">E-mail</span>
              <span className="link-line break-all">{site.email}</span>
            </span>
          </a>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-3">
            <InstagramIcon className="mt-0.5 h-4 w-4 text-copper-soft" />
            <span>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-paper/60">Instagram</span>
              <span className="link-line">{site.instagram.handle}</span>
            </span>
          </a>
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 text-copper-soft" aria-hidden="true" />
            <span>
              <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-paper/60">Loja</span>
              {site.address.street} · {site.address.district} · {site.address.city} — {site.address.state}
            </span>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
