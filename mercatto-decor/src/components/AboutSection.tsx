import Image from "next/image";
import { MapPin } from "lucide-react";
import Reveal from "./Reveal";
import { WhatsAppIcon } from "./Icons";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

// Parede de amostras: texturas reais dos catálogos.
const samples = [
  "/textures/placas/166-marmore-branco.jpg",
  "/textures/piso-colado/barao-jacaranda.jpg",
  "/textures/placas/169-linho-bege.jpg",
  "/textures/chateau/250-sophie.jpg",
  "/textures/placas/173-marmore-preto.jpg",
  "/textures/piso-colado/capri.jpg",
  "/textures/chateau/248-anglais.jpg",
  "/textures/placas/174-pastilha-cinza.jpg",
  "/textures/chateau/madeira-mogno-real.jpg",
];

const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${site.address.street}, ${site.address.district}, ${site.address.city} - ${site.address.state}`,
)}`;

export default function AboutSection() {
  return (
    <section id="sobre" aria-labelledby="sobre-title" className="bg-sand py-24 md:py-36">
      <div className="container-x grid items-center gap-16 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-5">
          <Reveal>
            <ul className="grid grid-cols-3 gap-2" aria-label="Amostras de padrões Mercatto Decor">
              {samples.map((src, i) => (
                <li key={src} className={`relative aspect-square overflow-hidden ${i % 2 === 1 ? "translate-y-4" : ""}`}>
                  <Image src={src} alt="" fill sizes="(min-width: 1024px) 13vw, 30vw" className="object-cover" />
                </li>
              ))}
            </ul>
            <p className="mt-10 text-xs text-stone">Amostras de padrões dos catálogos: mármores, madeiras, linho e pastilha.</p>
          </Reveal>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7">
          <Reveal>
            <p className="eyebrow flex items-center gap-3 text-copper-deep">
              <span className="font-serif text-sm tracking-normal">11</span>
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
              Sobre a Mercatto
            </p>
            <h2 id="sobre-title" className="display mt-5 text-[2.35rem] sm:text-5xl lg:text-[3.4rem]">
              Uma loja para ver, tocar e <em>escolher com segurança.</em>
            </h2>
            <div className="mt-8 space-y-5 leading-relaxed text-ink-soft">
              <p>
                A Mercatto Decor reúne, em Manaus, soluções para transformar piso, parede e teto: pisos vinílicos colados e SPC,
                placas de revestimento flexível, Château Mur e teto laminado — além de painéis ripados e boiseries.
              </p>
              <p>
                Cores impressas e telas são aproximadas. Por isso, na loja você vê a amostra física do padrão, confere o lote e
                resolve a quantidade com a nossa equipe, que acompanha cada etapa até o orçamento.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="mt-10 border-t border-ink/15 pt-8">
            <address className="flex gap-4 not-italic">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-copper" aria-hidden="true" />
              <span className="leading-relaxed">
                {site.address.street}
                <br />
                {site.address.district} · {site.address.city} — {site.address.state}
              </span>
            </address>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ink">
                <WhatsAppIcon className="h-4 w-4" />
                Fale com nossa equipe
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark">
                Como chegar
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
