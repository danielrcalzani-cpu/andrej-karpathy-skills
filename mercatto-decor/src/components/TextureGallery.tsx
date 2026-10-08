import Image from "next/image";
import SectionHeading from "./SectionHeading";
import MaterialHover from "./MaterialHover";
import { products, type Effect } from "@/data/products";

type Material = {
  effects: Effect[];
  name: string;
  text: string;
  texture: string;
  credit: string;
  /** Amostras pequenas são repetidas em escala real em vez de ampliadas. */
  tile?: number;
};

const materials: Material[] = [
  {
    effects: ["madeira"],
    name: "Madeira",
    text: "Veios em catedral, nós e raios do carvalho. Do palha claro ao castanho profundo, no chão, na parede e no teto.",
    texture: "/textures/spc/freijo.jpg",
    credit: "Piso SPC Freijó",
  },
  {
    effects: ["marmore"],
    name: "Mármore",
    text: "Fundos luminosos ou profundos, com veios cinza, taupe e dourados reproduzidos em alta resolução.",
    texture: "/textures/chateau/coronato-bianco-carrara.jpg",
    credit: "Coronato Bianco Carrara",
  },
  {
    effects: ["pedra"],
    name: "Pedra",
    text: "O visual da pedra calcária e das pedras bege acinzentadas: neutros quentes que servem de fundo para tudo.",
    texture: "/textures/placas/295-placa-vinilica-caliza.jpg",
    credit: "Placa Vinílica Caliza, cód. 295",
    tile: 248,
  },
  {
    effects: ["linho"],
    name: "Linho",
    text: "A trama do tecido na parede. Uma superfície que aquece o ambiente e pede para ser tocada.",
    texture: "/textures/placas/171-linho-cinza-escuro.jpg",
    credit: "Linho Cinza Escuro, cód. 171",
    tile: 327,
  },
  {
    effects: ["espelho", "liso"],
    name: "Brilho & liso",
    text: "Do cinza mate ao preto espelhado dos pianos de cauda: superfícies que refletem a luz e ampliam o espaço.",
    texture: "/textures/placas/167-black-piano.jpg",
    credit: "Black Piano, cód. 167",
  },
  {
    effects: ["pastilha"],
    name: "Pastilha",
    text: "O mosaico em prata e cinza, com o charme do revestimento cerâmico — sem rejunte e sem obra.",
    texture: "/textures/placas/174-pastilha-cinza.jpg",
    credit: "Pastilha Cinza, cód. 174",
    tile: 330,
  },
];

/**
 * Galeria de matérias em HTML + CSS puro (rádios + :has), para funcionar também onde
 * JavaScript não roda (ex.: pré-visualização de arquivos do iPhone). Estilos em globals.css (.mat-*).
 */
export default function TextureGallery() {
  return (
    <section id="materiais" aria-labelledby="materiais-title" className="bg-night py-16 text-paper md:py-36">
      <div className="container-x">
        <SectionHeading
          id="materiais-title"
          eyebrow="Matéria"
          tone="dark"
          title={
            <>
              Sinta a <em className="text-copper-soft">textura</em> antes de ver o ambiente.
            </>
          }
          intro="Amostras reais dos catálogos, em detalhe. Toque em um efeito para ver em quais padrões ele aparece — e peça a amostra física na loja antes da escolha final."
        />

        <div className="mat-gallery mt-12 md:mt-20" role="radiogroup" aria-label="Efeitos de superfície">
          {materials.map((m, i) => {
            const list = products.filter((p) => m.effects.includes(p.effect));
            return (
              <div key={m.name} className="mat-panel">
                <input type="radio" name="materia" id={`mat-${i}`} defaultChecked={i === 0} className="mat-radio sr-only" />
                {m.tile ? (
                  <div
                    aria-hidden="true"
                    className="mat-bg mat-bg-tile"
                    style={{ backgroundImage: `url(${m.texture})`, backgroundSize: `${m.tile}px` }}
                  />
                ) : (
                  <div aria-hidden="true" className="mat-bg">
                    <Image src={m.texture} alt="" fill sizes="(min-width: 768px) 60vw, 100vw" className="object-cover" />
                  </div>
                )}
                <div aria-hidden="true" className="mat-shade" />

                <label htmlFor={`mat-${i}`} className="mat-label">
                  <span className="mat-name font-serif text-2xl md:text-3xl">{m.name}</span>
                  <span className="mat-count">
                    {list.length} {list.length === 1 ? "padrão" : "padrões"}
                  </span>
                </label>

                <div className="mat-info">
                  <p className="max-w-md text-sm leading-relaxed text-paper/85 md:text-base">{m.text}</p>
                  <ul className="mt-5 flex flex-wrap gap-2" aria-label={`Padrões com efeito ${m.name.toLowerCase()}`}>
                    {list.slice(0, 7).map((p) => (
                      <li key={p.id} className="mat-swatch" title={p.name}>
                        <Image src={p.texture} alt="" fill sizes="56px" className="object-cover" />
                        <span className="sr-only">{p.name}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 max-w-lg text-sm text-paper/75">
                    {list
                      .slice(0, 7)
                      .map((p) => p.name)
                      .join(" · ")}
                    {list.length > 7 && ` e mais ${list.length - 7}`}
                  </p>
                  <p className="mt-3 text-[0.7rem] text-paper/50">Na imagem: {m.credit}</p>
                </div>
              </div>
            );
          })}
        </div>
        <MaterialHover />
      </div>
    </section>
  );
}
