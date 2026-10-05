import Image from "next/image";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

// Imagens de ambiente dos catálogos (ilustrativas). Produto identificado só quando o catálogo o indica.
const shots = [
  { src: "/projects/teto-02-sala-de-estar.jpg", aspect: "aspect-[4/5]", room: "Sala de estar", product: "Teto laminado · Padrão 02", alt: "Sala de estar com teto laminado mel claro e grandes janelas" },
  { src: "/projects/placas-173-marmore-preto-jantar.jpg", aspect: "aspect-square", room: "Sala de jantar", product: "Mármore Preto · cód. 173", alt: "Sala de jantar com parede em placa flexível Mármore Preto" },
  { src: "/projects/piso-monte-bianco-sala.jpg", aspect: "aspect-[4/3]", room: "Sala de estar", product: "Piso colado Monte Bianco", alt: "Sala de estar com piso vinílico Monte Bianco em bege acinzentado" },
  { src: "/projects/teto-05-escritorio.jpg", aspect: "aspect-[4/3]", room: "Escritório", product: "Teto laminado · Padrão 05", alt: "Escritório com teto laminado em castanho escuro" },
  { src: "/projects/placas-167-black-piano-comercial.jpg", aspect: "aspect-[4/5]", room: "Espaço comercial", product: "Black Piano · cód. 167", alt: "Recepção comercial com parede preta espelhada Black Piano" },
  { src: "/projects/chateau-mogno-real-jantar.jpg", aspect: "aspect-[4/3]", room: "Sala de jantar", product: "Madeira Mogno Real · alto brilho", alt: "Sala de jantar com parede em madeira Mogno Real de alto brilho" },
  { src: "/projects/piso-caramelo-comercial.jpg", aspect: "aspect-[4/3]", room: "Espaço comercial", product: "Piso colado Caramelo", alt: "Lounge comercial com piso vinílico Caramelo" },
  { src: "/projects/placas-174-pastilha-cinza-banheiro.jpg", aspect: "aspect-[4/5]", room: "Banheiro", product: "Pastilha Cinza · cód. 174", alt: "Banheiro com parede em placa flexível Pastilha Cinza" },
  { src: "/projects/teto-04-area-gourmet.jpg", aspect: "aspect-square", room: "Área gourmet", product: "Teto laminado · Padrão 04", alt: "Área gourmet com teto laminado em cedro avermelhado" },
  { src: "/projects/chateau-sala.jpg", aspect: "aspect-[16/9]", room: "Sala", product: "Château Mur", alt: "Sala de estar com parede revestida em Château Mur" },
  { src: "/projects/placas-171-linho-cinza-escuro-sala.jpg", aspect: "aspect-[4/5]", room: "Sala de estar", product: "Linho Cinza Escuro · cód. 171", alt: "Sala de estar com parede em placa flexível Linho Cinza Escuro" },
  { src: "/projects/spc-serras-lounge.jpg", aspect: "aspect-[4/3]", room: "Convivência", product: "Piso SPC · Linha Serras", alt: "Espaço de convivência com piso vinílico SPC da Linha Serras" },
  { src: "/projects/teto-06-banheiro.jpg", aspect: "aspect-[4/3]", room: "Banheiro", product: "Teto laminado · Padrão 06", alt: "Banheiro com teto laminado em carvalho natural claro" },
];

export default function InspirationGallery() {
  return (
    <section id="inspiracoes" aria-labelledby="inspiracoes-title" className="bg-paper py-24 md:py-36">
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

        <ul className="mt-16 columns-2 gap-3 md:gap-6 lg:columns-3">
          {shots.map((s, i) => (
            <li key={s.src} className="mb-3 break-inside-avoid md:mb-6">
              <Reveal delay={(i % 3) * 90}>
                <figure className="group">
                  <div className={`relative overflow-hidden bg-linen ${s.aspect}`}>
                    <Image
                      src={s.src}
                      alt={s.alt}
                      fill
                      sizes="(min-width: 1024px) 30vw, 48vw"
                      className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-arch)] group-hover:scale-105"
                    />
                  </div>
                  <figcaption className="mt-3 flex flex-col gap-0.5 text-xs sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <span className="uppercase tracking-[0.16em] text-ink">{s.room}</span>
                    <span className="text-stone">{s.product}</span>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
