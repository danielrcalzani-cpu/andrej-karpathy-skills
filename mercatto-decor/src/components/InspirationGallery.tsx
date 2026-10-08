import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import { InstagramIcon, WhatsAppIcon } from "./Icons";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { products } from "@/data/products";

// Imagens de ambiente dos catálogos (ilustrativas). Produto identificado só quando o catálogo o indica.
type Shot = { src: string; room: string; product: string; alt: string };

const s = {
  sala: { src: "/projects/teto-02-sala-de-estar.jpg", room: "Sala de estar", product: "Teto laminado Carvalho", alt: "Sala de estar com teto laminado mel claro e grandes janelas" },
  jantarPreto: { src: "/projects/placas-173-marmore-preto-jantar.jpg", room: "Sala de jantar", product: "Mármore Preto · cód. 173", alt: "Sala de jantar com parede em placa flexível Mármore Preto" },
  gourmet: { src: "/projects/teto-04-area-gourmet.jpg", room: "Área gourmet", product: "Teto laminado Mogno", alt: "Área gourmet com teto laminado Mogno, em mogno avermelhado" },
  blackPiano: { src: "/projects/placas-167-black-piano-comercial.jpg", room: "Espaço comercial", product: "Black Piano · cód. 167", alt: "Recepção comercial com parede preta espelhada Black Piano" },
  monteBianco: { src: "/projects/piso-monte-bianco-sala.jpg", room: "Sala de estar", product: "Piso colado Monte Bianco", alt: "Sala de estar com piso vinílico Monte Bianco em bege acinzentado" },
  pastilha: { src: "/projects/placas-174-pastilha-cinza-banheiro.jpg", room: "Banheiro", product: "Pastilha Cinza · cód. 174", alt: "Banheiro com parede em placa flexível Pastilha Cinza" },
  chateauSala: { src: "/projects/chateau-sala.jpg", room: "Sala", product: "Château Mur", alt: "Sala de estar com parede revestida em Château Mur" },
  escritorio: { src: "/projects/teto-05-escritorio.jpg", room: "Escritório", product: "Teto laminado Pinewood", alt: "Escritório com teto laminado em castanho escuro" },
  mogno: { src: "/projects/chateau-mogno-real-jantar.jpg", room: "Sala de jantar", product: "Madeira Mogno Real · alto brilho", alt: "Sala de jantar com parede em madeira Mogno Real de alto brilho" },
  caramelo: { src: "/projects/piso-caramelo-comercial.jpg", room: "Espaço comercial", product: "Piso colado Caramelo", alt: "Lounge comercial com piso vinílico Caramelo" },
  linho: { src: "/projects/placas-171-linho-cinza-escuro-sala.jpg", room: "Sala de estar", product: "Linho Cinza Escuro · cód. 171", alt: "Sala de estar com parede em placa flexível Linho Cinza Escuro" },
  banheiro: { src: "/projects/teto-06-banheiro.jpg", room: "Banheiro", product: "Teto laminado Carvalho Natural", alt: "Banheiro com teto laminado em carvalho natural claro" },
} satisfies Record<string, Shot>;

const byId = (id: string) => products.find((p) => p.id === id)!;
const pairs = [
  { room: "Banheiro", surface: "Parede · mármore", p: byId("placa-166-marmore-branco") },
  { room: "Quarto", surface: "Piso · madeira", p: byId("piso-barao-jacaranda") },
  { room: "Sala", surface: "Parede · linho", p: byId("placa-171-linho-cinza-escuro") },
  { room: "Cozinha", surface: "Piso · SPC", p: byId("spc-bocaina") },
  { room: "Sala de jantar", surface: "Teto · madeira", p: byId("teto-padrao-07") },
  { room: "Loja", surface: "Parede · brilho", p: byId("placa-167-black-piano") },
];

/** Foto com legenda sobreposta (sempre visível — também no celular) e zoom lento no hover. */
function Frame({ shot, className = "", sizes, large = false }: { shot: Shot; className?: string; sizes: string; large?: boolean }) {
  return (
    <figure className={`group relative overflow-hidden bg-linen ${className}`}>
      <Image
        src={shot.src}
        alt={shot.alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-arch)] group-hover:scale-105"
      />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-night/75 to-transparent" />
      <figcaption className={`absolute inset-x-0 bottom-0 text-paper ${large ? "p-5 md:p-8" : "p-4 md:p-5"}`}>
        <span className={`block font-serif leading-tight ${large ? "text-2xl md:text-4xl" : "text-base md:text-xl"}`}>{shot.room}</span>
        <span
          className={`mt-1 items-center gap-2 text-[0.65rem] uppercase tracking-[0.18em] text-paper/80 md:flex md:text-[0.7rem] ${
            large ? "flex" : "hidden"
          }`}
        >
          <span aria-hidden="true" className="h-px w-5 bg-copper-soft" />
          {shot.product}
        </span>
      </figcaption>
    </figure>
  );
}

export default function InspirationGallery() {
  return (
    <section id="inspiracoes" aria-labelledby="inspiracoes-title" className="overflow-hidden bg-paper py-16 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="inspiracoes-title"
          eyebrow="Inspirações"
          title={
            <>
              Inspiração para <em>transformar.</em>
            </>
          }
          intro="Salas, quartos, banheiros, escritórios e espaços comerciais com as superfícies Mercatto Decor. Imagens ilustrativas dos nossos catálogos."
        />

        {/* 1 — imagem principal + coluna de apoio */}
        <div className="mt-12 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-12 md:gap-5">
          <Reveal variant="image" className="col-span-2 md:col-span-8 md:row-span-2">
            <Frame shot={s.sala} large className="aspect-[4/5] md:aspect-auto md:h-full md:min-h-[38rem]" sizes="(min-width: 768px) 62vw, 100vw" />
          </Reveal>
          <Reveal variant="image" delay={120} className="md:col-span-4">
            <Frame shot={s.jantarPreto} className="aspect-[4/5] md:aspect-[4/3]" sizes="(min-width: 768px) 30vw, 50vw" />
          </Reveal>
          <Reveal variant="image" delay={200} className="md:col-span-4">
            <Frame shot={s.gourmet} className="aspect-[4/5] md:aspect-[4/3]" sizes="(min-width: 768px) 30vw, 50vw" />
          </Reveal>
        </div>
      </div>

      {/* 2 — um ambiente, uma superfície (pares tirados do "Ideal para" dos catálogos) */}
      <div className="container-x mt-16 md:mt-28">
        <Reveal className="grid gap-6 border-t border-ink/15 pt-10 md:grid-cols-12 md:items-end md:pt-14">
          <p className="display text-[2.1rem] leading-[1.1] md:col-span-7 md:text-5xl">
            Cada ambiente pede <em>uma superfície.</em>
          </p>
          <p className="max-w-md text-sm leading-relaxed text-ink-soft md:col-span-5">
            Mármore para o banheiro, madeira para o quarto, linho para a sala, brilho para a loja. Piso, parede e teto
            podem ser combinados no mesmo projeto.
          </p>
        </Reveal>
        <ul className="mt-10 grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:mt-14 md:gap-x-5 lg:grid-cols-6">
          {pairs.map(({ room, surface, p }, i) => (
            <Reveal as="li" key={p.id} delay={i * 70}>
              <div className="relative aspect-square overflow-hidden bg-linen">
                <Image src={p.texture} alt={`Amostra ${p.name}`} fill sizes="(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw" className="object-cover" />
              </div>
              <p className="mt-4 font-serif text-xl leading-tight md:text-2xl">{room}</p>
              <p className="mt-1.5 flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-copper-deep">
                <span aria-hidden="true" className="h-px w-4 bg-copper" />
                {surface}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{p.name}</p>
            </Reveal>
          ))}
        </ul>
      </div>

      {/* 3 — trio desencontrado */}
      <div className="container-x mt-14 md:mt-24">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:items-start md:gap-5">
          <Reveal variant="image" className="md:col-span-4">
            <Frame shot={s.blackPiano} className="aspect-[3/4]" sizes="(min-width: 768px) 30vw, 50vw" />
          </Reveal>
          <Reveal variant="image" delay={120} className="mt-10 md:col-span-5 md:mt-24">
            <Frame shot={s.monteBianco} className="aspect-[3/4] md:aspect-[4/3]" sizes="(min-width: 768px) 40vw, 50vw" />
          </Reveal>
          <Reveal variant="image" delay={200} className="col-span-2 md:col-span-3 md:mt-48">
            <Frame shot={s.pastilha} className="aspect-[4/3] md:aspect-[3/4]" sizes="(min-width: 768px) 24vw, 100vw" />
          </Reveal>
        </div>
      </div>

      {/* 4 — panorama de ponta a ponta */}
      <Reveal variant="image" className="mt-14 md:mt-24">
        <Frame shot={s.chateauSala} large className="aspect-[4/3] w-full md:aspect-[21/8]" sizes="100vw" />
      </Reveal>

      {/* 5 — mosaico final */}
      <div className="container-x mt-3 md:mt-5">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-12 md:gap-5">
          <Reveal variant="image" className="col-span-2 md:col-span-6">
            <Frame shot={s.escritorio} className="aspect-[4/3]" sizes="(min-width: 768px) 48vw, 100vw" />
          </Reveal>
          <Reveal variant="image" delay={100} className="md:col-span-3">
            <Frame shot={s.mogno} className="aspect-[3/4] md:h-full md:aspect-auto" sizes="(min-width: 768px) 24vw, 50vw" />
          </Reveal>
          <Reveal variant="image" delay={180} className="md:col-span-3">
            <Frame shot={s.linho} className="aspect-[3/4] md:h-full md:aspect-auto" sizes="(min-width: 768px) 24vw, 50vw" />
          </Reveal>
          <Reveal variant="image" className="md:col-span-5">
            <Frame shot={s.caramelo} className="aspect-[4/5] md:aspect-[16/10]" sizes="(min-width: 768px) 40vw, 50vw" />
          </Reveal>
          <Reveal variant="image" delay={100} className="md:col-span-4">
            <Frame shot={s.banheiro} className="aspect-[4/5] md:aspect-auto md:h-full" sizes="(min-width: 768px) 32vw, 50vw" />
          </Reveal>

          {/* chamada */}
          <Reveal delay={180} className="col-span-2 flex flex-col justify-between gap-6 bg-night p-6 text-paper md:col-span-3 md:p-7">
            <p className="font-serif text-2xl leading-snug">
              Gostou de algum <em className="text-copper-soft">ambiente?</em>
            </p>
            <div className="flex flex-col gap-3 text-[0.72rem] font-medium uppercase tracking-[0.16em]">
              <a
                href={whatsappUrl("Olá! Vi as inspirações no site da Mercatto Decor e gostaria de ajuda para escolher a superfície do meu ambiente.")}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-copper-soft"
              >
                <WhatsAppIcon className="h-4 w-4" /> Quero algo assim
              </a>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-paper/70 hover:text-paper">
                <InstagramIcon className="h-4 w-4" /> Mais no Instagram <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
