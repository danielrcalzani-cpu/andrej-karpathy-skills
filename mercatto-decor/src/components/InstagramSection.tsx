import Image from "next/image";
import Reveal from "./Reveal";
import { InstagramIcon } from "./Icons";
import { site } from "@/data/site";

// Não é um feed ao vivo: imagens dos catálogos com link para o perfil.
const tiles = [
  { src: "/projects/teto-07-sala-de-jantar.jpg", alt: "Sala de jantar com teto laminado Nogueira Mel" },
  { src: "/textures/chateau/247-troussay.jpg", alt: "Detalhe do mármore Troussay" },
  { src: "/projects/placas-marmore-sala.jpg", alt: "Parede em mármore branco com sofá amarelo" },
  { src: "/textures/spc/caparao.jpg", alt: "Detalhe do piso SPC Caparaó" },
  { src: "/projects/chateau-quarto.jpg", alt: "Quarto com parede Château Mur em madeira" },
  { src: "/textures/placas/171-linho-cinza-escuro.jpg", alt: "Detalhe da textura Linho Cinza Escuro" },
];

export default function InstagramSection() {
  return (
    <section aria-labelledby="insta-title" className="overflow-hidden bg-paper py-16 md:py-32">
      <div className="container-x grid items-end gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-7">
          <p className="eyebrow text-copper-deep">Instagram</p>
          <h2 id="insta-title" className="display mt-5 text-[2.6rem] sm:text-6xl lg:text-7xl">
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="link-line">
              {site.instagram.handle}
            </a>
          </h2>
        </Reveal>
        <Reveal delay={120} className="md:col-span-5">
          <p className="max-w-sm leading-relaxed text-ink-soft">
            {site.instagram.followers} seguidores acompanham por lá projetos, novidades da loja e dicas para escolher o revestimento
            certo.
          </p>
          <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-dark mt-6">
            <InstagramIcon className="h-4 w-4" />
            Siga a Mercatto Decor
          </a>
        </Reveal>
      </div>

      <ul className="mt-14 grid grid-cols-3 gap-1 md:grid-cols-6">
        {tiles.map((t) => (
          <li key={t.src}>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden"
              aria-label={`${t.alt} — ver mais no Instagram`}
            >
              <Image src={t.src} alt="" fill sizes="(min-width: 768px) 17vw, 33vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center bg-night/0 text-paper opacity-0 transition-all duration-500 group-hover:bg-night/45 group-hover:opacity-100">
                <InstagramIcon className="h-7 w-7" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
