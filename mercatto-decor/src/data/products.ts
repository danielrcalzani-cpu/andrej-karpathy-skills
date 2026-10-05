// Padrões extraídos dos catálogos Mercatto Decor (edição 2026).
// Só preenchemos campos presentes no catálogo; o que o catálogo indica como
// "sob consulta" fica assim, ou é omitido.

import type { FamilyId } from "./collections";

export type Effect = "madeira" | "marmore" | "pedra" | "linho" | "liso" | "espelho" | "pastilha";

export type Product = {
  id: string;
  name: string;
  code?: string;
  family: FamilyId;
  collection: string;
  effect: Effect;
  effectLabel: string;
  tone: string;
  description: string;
  dimensions?: string;
  thickness?: string;
  area?: string;
  wearLayer?: string;
  installation?: string;
  packaging?: string;
  finish?: string;
  idealFor: string[];
  texture: string;
  image?: { src: string; label: string };
};

const CHATEAU = {
  family: "chateau" as const,
  dimensions: "2,80 × 0,92 m",
  area: "2,58 m² por placa",
  thickness: "2 mm",
  packaging: "02 placas · 5,16 m²",
};

const PLACA = {
  family: "placas" as const,
  dimensions: "2,90 × 1,22 m",
  area: "3,54 m² por placa",
  thickness: "3 mm",
};

const COLADO = { family: "piso-colado" as const, effect: "madeira" as const, effectLabel: "Madeira", installation: "Colada" };
const SPC = {
  family: "piso-spc" as const,
  effect: "madeira" as const,
  effectLabel: "Madeira",
  dimensions: "0,23 × 1,40 m",
  area: "0,322 m² por régua",
  installation: "Clique Uniclic",
};
const TETO = { family: "teto" as const, collection: "Teto laminado", effect: "madeira" as const, effectLabel: "Madeira", finish: "Amadeirado" };

export const products: Product[] = [
  // ───────────── Château Mur
  {
    ...CHATEAU,
    id: "chateau-anglais",
    name: "Anglais",
    code: "248",
    collection: "Coleção Château Mur",
    effect: "pedra",
    effectLabel: "Pedra",
    tone: "Bege acinzentado",
    description:
      "Pedra bege acinzentada, de fundo suave e veios claros bem discretos. Um neutro quente que serve de fundo para qualquer decoração.",
    idealFor: ["Sala", "Quarto", "Comercial"],
    texture: "/textures/chateau/248-anglais.jpg",
  },
  {
    ...CHATEAU,
    id: "chateau-jolie",
    name: "Jolie",
    code: "251",
    collection: "Coleção Château Mur",
    effect: "madeira",
    effectLabel: "Madeira",
    tone: "Carvalho natural claro",
    description:
      "Madeira clara de veios longos e desenho uniforme, no tom natural do carvalho. Leveza e aconchego sem escurecer o ambiente.",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/chateau/251-jolie.jpg",
  },
  {
    ...CHATEAU,
    id: "chateau-marie",
    name: "Marie",
    code: "249",
    collection: "Coleção Château Mur",
    effect: "madeira",
    effectLabel: "Madeira",
    tone: "Castanho médio",
    description:
      "Madeira em castanho médio, de veios finos e acabamento sóbrio. Aquece a parede com elegância em paredes de destaque.",
    idealFor: ["Sala", "Escritório", "Comercial"],
    texture: "/textures/chateau/249-marie.jpg",
  },
  {
    ...CHATEAU,
    id: "chateau-sophie",
    name: "Sophie",
    code: "250",
    collection: "Coleção Château Mur",
    effect: "madeira",
    effectLabel: "Madeira",
    tone: "Madeira escura",
    description:
      "Madeira escura com nós aparentes e textura rústica. Dá caráter e profundidade a salas de jantar, cabeceiras, lojas e recepções.",
    idealFor: ["Sala", "Quarto", "Comercial"],
    texture: "/textures/chateau/250-sophie.jpg",
  },
  {
    ...CHATEAU,
    id: "chateau-troussay",
    name: "Troussay",
    code: "247",
    collection: "Coleção Château Mur",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Branco com veios cinza e dourados",
    description:
      "Mármore branco com veios cinza e traços dourados, de desenho marcante. Paredes de destaque em lavabos, painéis de TV, halls e recepções.",
    idealFor: ["Banheiro", "Sala", "Comercial"],
    texture: "/textures/chateau/247-troussay.jpg",
    image: { src: "/projects/chateau-troussay-loja.jpg", label: "Loja" },
  },
  {
    id: "coronato-storm-gray",
    family: "chateau",
    name: "Storm Gray",
    collection: "Coronato · Pedras",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Cinza suave",
    description:
      "Cinza suave, com nuances de fumaça e veios claros muito discretos. Um neutro contemporâneo que combina com madeira, preto e metais.",
    dimensions: "Sob consulta",
    idealFor: ["Sala", "Quarto", "Comercial"],
    texture: "/textures/chateau/coronato-storm-gray.jpg",
  },
  {
    id: "coronato-bianco-carrara",
    family: "chateau",
    name: "Bianco Carrara",
    collection: "Coronato · Pedras",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Branco luminoso",
    description:
      "Branco luminoso com veios em cinza e taupe, no desenho clássico do mármore Carrara. Ilumina e amplia o ambiente.",
    dimensions: "Sob consulta",
    idealFor: ["Sala", "Banheiro", "Comercial"],
    texture: "/textures/chateau/coronato-bianco-carrara.jpg",
  },
  {
    id: "madeira-mogno-real",
    family: "chateau",
    name: "Mogno Real",
    collection: "Madeiras · alto brilho",
    effect: "madeira",
    effectLabel: "Madeira",
    tone: "Avermelhado",
    finish: "Alto brilho",
    description:
      "Madeira avermelhada de veios longos e acabamento brilhante, que traz calor e sofisticação. Para painéis de TV, halls e recepções.",
    dimensions: "Sob consulta",
    idealFor: ["Sala", "Comercial", "Escritório"],
    texture: "/textures/chateau/madeira-mogno-real.jpg",
    image: { src: "/projects/chateau-mogno-real-jantar.jpg", label: "Sala de jantar" },
  },
  {
    id: "madeira-carvalho-mel",
    family: "chateau",
    name: "Carvalho Mel",
    collection: "Madeiras · alto brilho",
    effect: "madeira",
    effectLabel: "Madeira",
    tone: "Mel dourado",
    finish: "Alto brilho",
    description:
      "Tom mel dourado com desenho suave de carvalho e brilho acetinado. Ilumina o ambiente e combina com branco, preto e verde.",
    dimensions: "Sob consulta",
    idealFor: ["Sala", "Quarto", "Comercial"],
    texture: "/textures/chateau/madeira-carvalho-mel.jpg",
  },

  // ───────────── Placas de revestimento flexível
  {
    ...PLACA,
    id: "placa-166-marmore-branco",
    name: "Mármore Branco",
    code: "166",
    collection: "Mármores",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Branco luminoso",
    description:
      "Fundo branco luminoso com veios em cinza e dourado, em alta resolução. O visual nobre do mármore, sem quebra-quebra.",
    idealFor: ["Sala", "Banheiro", "Cozinha", "Comercial"],
    texture: "/textures/placas/166-marmore-branco.jpg",
    image: { src: "/projects/placas-marmore-sala.jpg", label: "Sala" },
  },
  {
    ...PLACA,
    id: "placa-172-marmore-cinza",
    name: "Mármore Cinza",
    code: "172",
    collection: "Mármores",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Cinza",
    description:
      "Mármore cinza de veios finos e delicados, com uma mistura suave de tons. Um toque discreto de cor e sofisticação.",
    idealFor: ["Quarto", "Sala", "Escritório", "Comercial"],
    texture: "/textures/placas/172-marmore-cinza.jpg",
  },
  {
    ...PLACA,
    id: "placa-173-marmore-preto",
    name: "Mármore Preto",
    code: "173",
    collection: "Mármores",
    effect: "marmore",
    effectLabel: "Mármore",
    tone: "Preto profundo",
    description:
      "Preto profundo com veios brancos marcantes. Cria paredes de destaque cheias de personalidade em salas de jantar, halls e lojas.",
    idealFor: ["Sala", "Comercial", "Escritório", "Banheiro"],
    texture: "/textures/placas/173-marmore-preto.jpg",
    image: { src: "/projects/placas-173-marmore-preto-jantar.jpg", label: "Sala de jantar" },
  },
  {
    id: "placa-295-caliza",
    family: "placas",
    name: "Placa Vinílica Caliza",
    code: "295",
    collection: "Mármores",
    effect: "pedra",
    effectLabel: "Pedra (placa vinílica)",
    tone: "Cinza calcário",
    description:
      "Placa vinílica com visual de pedra calcária em tons de cinza e veios suaves. Leve e prática de aplicar com adesivo PU.",
    dimensions: "2,75 × 1,20 m",
    area: "3,30 m² por placa",
    thickness: "3 mm",
    idealFor: ["Sala", "Quarto", "Escritório", "Comercial"],
    texture: "/textures/placas/295-placa-vinilica-caliza.jpg",
  },
  {
    ...PLACA,
    id: "placa-169-linho-bege",
    name: "Linho Bege",
    code: "169",
    collection: "Linhos & Texturas",
    effect: "linho",
    effectLabel: "Textura de linho",
    tone: "Bege suave",
    description:
      "Textura de linho em tom suave e acolhedor, com a sensação de tecido natural na parede. Ambientes mais claros e arejados.",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/placas/169-linho-bege.jpg",
  },
  {
    ...PLACA,
    id: "placa-170-linho-cinza-claro",
    name: "Linho Cinza Claro",
    code: "170",
    collection: "Linhos & Texturas",
    effect: "linho",
    effectLabel: "Textura de linho",
    tone: "Cinza claro",
    description:
      "Trama de linho em tom claro e neutro, que traz textura e aconchego à parede sem pesar no ambiente.",
    idealFor: ["Quarto", "Sala", "Escritório"],
    texture: "/textures/placas/170-linho-cinza-claro.jpg",
  },
  {
    ...PLACA,
    id: "placa-171-linho-cinza-escuro",
    name: "Linho Cinza Escuro",
    code: "171",
    collection: "Linhos & Texturas",
    effect: "linho",
    effectLabel: "Textura de tecido",
    tone: "Cinza escuro",
    description:
      "Cinza com efeito de tecido, de trama marcada e visual sofisticado. Profundidade para paredes de destaque, cabeceiras e escritórios.",
    idealFor: ["Sala", "Quarto", "Escritório", "Comercial"],
    texture: "/textures/placas/171-linho-cinza-escuro.jpg",
    image: { src: "/projects/placas-171-linho-cinza-escuro-sala.jpg", label: "Sala de estar" },
  },
  {
    ...PLACA,
    id: "placa-191-cinza",
    name: "Cinza",
    code: "191",
    collection: "Lisos & Especiais",
    effect: "liso",
    effectLabel: "Liso mate",
    tone: "Cinza claro",
    description:
      "Cinza claro liso, de acabamento mate: um clássico que amplia visualmente os espaços e combina com qualquer estilo.",
    idealFor: ["Sala", "Quarto", "Escritório", "Comercial"],
    texture: "/textures/placas/191-cinza.jpg",
  },
  {
    ...PLACA,
    id: "placa-167-black-piano",
    name: "Black Piano",
    code: "167",
    collection: "Lisos & Especiais",
    effect: "espelho",
    effectLabel: "Espelho (brilho intenso)",
    tone: "Preto intenso",
    description:
      "Preto intenso com brilho espelhado, inspirado no acabamento dos pianos de cauda. Luxuoso para lojas, recepções e salas.",
    idealFor: ["Comercial", "Sala", "Escritório"],
    texture: "/textures/placas/167-black-piano.jpg",
    image: { src: "/projects/placas-167-black-piano-comercial.jpg", label: "Espaço comercial" },
  },
  {
    ...PLACA,
    id: "placa-168-espelhado",
    name: "Espelhado",
    code: "168",
    collection: "Lisos & Especiais",
    effect: "espelho",
    effectLabel: "Espelho",
    tone: "Reflexivo",
    description:
      "Superfície espelhada que reflete a luz e amplia a sensação de espaço. Para closets, corredores e lojas.",
    idealFor: ["Comercial", "Quarto", "Sala"],
    texture: "/textures/placas/168-espelhado.jpg",
  },
  {
    ...PLACA,
    id: "placa-174-pastilha-cinza",
    name: "Pastilha Cinza",
    code: "174",
    collection: "Lisos & Especiais",
    effect: "pastilha",
    effectLabel: "Pastilha",
    tone: "Prata e cinza",
    description:
      "Mosaico de pastilhas em tons de prata e cinza, com o charme do revestimento cerâmico sem rejunte e sem obra.",
    idealFor: ["Banheiro", "Cozinha", "Sala"],
    texture: "/textures/placas/174-pastilha-cinza.jpg",
    image: { src: "/projects/placas-174-pastilha-cinza-banheiro.jpg", label: "Banheiro" },
  },

  // ───────────── Piso vinílico colado
  {
    ...COLADO,
    id: "piso-contenssa",
    name: "Contenssa",
    collection: "Linha Nobiltà",
    tone: "Castanho acinzentado",
    description:
      "Carvalho castanho médio acinzentado, com veios em catedral e pequenos nós. O padrão de equilíbrio: conversa com quase todos os estilos.",
    thickness: "2 mm",
    wearLayer: "0,15 mm",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/piso-colado/contenssa.jpg",
    image: { src: "/projects/piso-contenssa-escritorio.jpg", label: "Escritório" },
  },
  {
    ...COLADO,
    id: "piso-barone",
    name: "Barone",
    collection: "Linha Nobiltà",
    tone: "Palha claro",
    description:
      "Madeira clara em tom palha, com veios amplos e ondulados. Traz luz e amplia visualmente espaços pequenos.",
    thickness: "2 mm",
    wearLayer: "0,15 mm",
    idealFor: ["Quarto", "Sala", "Escritório"],
    texture: "/textures/piso-colado/barone.jpg",
  },
  {
    ...COLADO,
    id: "piso-duchessa",
    name: "Duchessa",
    collection: "Linha Nobiltà",
    tone: "Rosado claro",
    description:
      "Madeira de tom rosado, entre o cedro e o salmão, com veios finos e retos. Delicado e caloroso, de aparência limpa e contínua.",
    thickness: "2 mm",
    wearLayer: "0,15 mm",
    idealFor: ["Quarto", "Sala", "Closet"],
    texture: "/textures/piso-colado/duchessa.jpg",
  },
  {
    ...COLADO,
    id: "piso-imperatore",
    name: "Imperatore",
    collection: "Linha Nobiltà",
    tone: "Castanho escuro",
    description:
      "Castanho profundo com veios longos e nós marcantes, no estilo da nogueira. O padrão mais intenso: imponência e sofisticação.",
    thickness: "2 mm",
    wearLayer: "0,15 mm",
    idealFor: ["Sala", "Sala de jantar", "Escritório"],
    texture: "/textures/piso-colado/imperatore.jpg",
  },
  {
    ...COLADO,
    id: "piso-capri",
    name: "Capri",
    collection: "Linha Paesaggi",
    tone: "Cinza claro",
    description:
      "Carvalho em cinza claro, quase cinza-gelo, com veios finos e retos. Moderno e sereno, para ambientes minimalistas e escandinavos.",
    dimensions: "18,4 × 95 cm",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Quarto", "Sala", "Escritório"],
    texture: "/textures/piso-colado/capri.jpg",
  },
  {
    ...COLADO,
    id: "piso-monte-bianco",
    name: "Monte Bianco",
    collection: "Linha Paesaggi",
    tone: "Bege acinzentado",
    description:
      "Carvalho greige com veios em catedral bem desenhados. Entre o quente e o frio: claro, suave e acolhedor.",
    dimensions: "18,4 × 95 cm",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Sala", "Quarto", "Sala de jantar"],
    texture: "/textures/piso-colado/monte-bianco.jpg",
    image: { src: "/projects/piso-monte-bianco-sala.jpg", label: "Sala de estar" },
  },
  {
    ...COLADO,
    id: "piso-branco-imperial",
    name: "Branco Imperial",
    collection: "Linha Realeza",
    tone: "Branco acinzentado",
    description:
      "Madeira quase off-white, com veios suaves e discretos. O padrão mais claro: ilumina e amplia visualmente os espaços.",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Quarto", "Sala", "Escritório"],
    texture: "/textures/piso-colado/branco-imperial.jpg",
  },
  {
    ...COLADO,
    id: "piso-barao-jacaranda",
    name: "Barão Jacarandá",
    collection: "Linha Realeza",
    tone: "Mel dourado",
    description:
      "Madeira em tom mel dourado, com catedrais bem desenhadas e marcas de nós. Aconchego e um ar clássico brasileiro.",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Sala", "Quarto", "Sala de jantar"],
    texture: "/textures/piso-colado/barao-jacaranda.jpg",
    image: { src: "/projects/piso-barao-jacaranda-jantar.jpg", label: "Sala de jantar" },
  },
  {
    ...COLADO,
    id: "piso-castanheira-nobre",
    name: "Castanheira Nobre",
    collection: "Linha Realeza",
    tone: "Castanho-avermelhado",
    description:
      "Inspirado na castanheira, gigante da Amazônia: castanho-avermelhado intenso, veios finos e catedrais ao longo da régua.",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Sala", "Escritório", "Sala de jantar"],
    texture: "/textures/piso-colado/castanheira-nobre.jpg",
  },
  {
    ...COLADO,
    id: "piso-ype-supreme",
    name: "Ypê Supreme",
    collection: "Linha Realeza",
    tone: "Castanho oliva",
    description:
      "Carvalho castanho acinzentado com toque oliva e veios longos. Natural e versátil, do rústico ao contemporâneo.",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Sala", "Quarto", "Sala de jantar"],
    texture: "/textures/piso-colado/ype-supreme.jpg",
  },
  {
    ...COLADO,
    id: "piso-platinum-rei",
    name: "Platinum Rei",
    collection: "Linha Realeza",
    tone: "Cinza médio",
    description:
      "Carvalho em cinza médio, com catedrais e nós discretos. Sóbrio e elegante para projetos modernos e industriais.",
    thickness: "2 mm",
    wearLayer: "0,20 mm",
    idealFor: ["Sala", "Escritório", "Quarto"],
    texture: "/textures/piso-colado/platinum-rei.jpg",
    image: { src: "/projects/piso-platinum-rei-quarto.jpg", label: "Quarto" },
  },
  {
    ...COLADO,
    id: "piso-damasco",
    name: "Damasco",
    collection: "Linha Sole",
    tone: "Mel alaranjado",
    description:
      "Carvalho cor de damasco, com veios em catedral marcados. Quente e acolhedor, a cor da madeira tradicional.",
    thickness: "2 mm",
    wearLayer: "0,30 mm",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/piso-colado/damasco.jpg",
  },
  {
    ...COLADO,
    id: "piso-toscana",
    name: "Toscana",
    collection: "Linha Sole",
    tone: "Bege dourado",
    description:
      "Carvalho natural claro em bege dourado, com catedrais e finos raios. O mais encorpado da coleção, com 3 mm.",
    thickness: "3 mm",
    wearLayer: "0,30 mm",
    idealFor: ["Sala", "Quarto", "Sala de jantar"],
    texture: "/textures/piso-colado/toscana.jpg",
    image: { src: "/projects/piso-toscana-sala.jpg", label: "Sala de estar" },
  },
  {
    ...COLADO,
    id: "piso-caramelo",
    name: "Caramelo",
    collection: "Linha Sole",
    tone: "Castanho caramelo",
    description:
      "Castanho médio cor de caramelo, com veios longos e catedrais suaves. Um coringa: madeira com presença sem pesar.",
    thickness: "2 mm",
    wearLayer: "0,30 mm",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/piso-colado/caramelo.jpg",
    image: { src: "/projects/piso-caramelo-comercial.jpg", label: "Espaço comercial" },
  },

  // ───────────── Piso vinílico SPC
  {
    ...SPC,
    id: "spc-caparao",
    name: "Caparaó",
    collection: "Linha Serras",
    tone: "Castanho-avermelhado",
    description:
      "Veios longos e marcados em faixas de mel e conhaque, com a profundidade da nogueira. O mais quente da coleção.",
    wearLayer: "0,30 mm",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/spc/caparao.jpg",
  },
  {
    ...SPC,
    id: "spc-bocaina",
    name: "Bocaina",
    collection: "Linha Serras",
    tone: "Mel dourado",
    description:
      "Carvalho rústico com veios ondulados e pequenas fissuras escuras. À prova d’água, vai bem também em cozinhas e circulação.",
    wearLayer: "0,30 mm",
    idealFor: ["Sala", "Cozinha", "Comercial"],
    texture: "/textures/spc/bocaina.jpg",
  },
  {
    ...SPC,
    id: "spc-canastra",
    name: "Canastra",
    collection: "Linha Serras",
    tone: "Bege acinzentado",
    description:
      "Carvalho claro de veios finos e retos. O mais suave: reflete a luz e cria a base neutra do estilo escandinavo.",
    wearLayer: "0,30 mm",
    idealFor: ["Quarto", "Sala", "Escritório"],
    texture: "/textures/spc/canastra.jpg",
  },
  {
    ...SPC,
    id: "spc-freijo",
    name: "Freijó",
    collection: "Linha Madeiras Brasileiras",
    tone: "Mel médio",
    description:
      "Inspirado no freijó da marcenaria brasileira: veios finos, retos e regulares. O mais versátil, com capa de uso de 0,50 mm.",
    wearLayer: "0,50 mm",
    idealFor: ["Sala", "Quarto", "Comercial"],
    texture: "/textures/spc/freijo.jpg",
    image: { src: "/projects/spc-madeiras-brasileiras-jantar.jpg", label: "Cozinha e jantar" },
  },

  // ───────────── Teto laminado (padrões ainda sem nome comercial no catálogo)
  {
    ...TETO,
    id: "teto-padrao-01",
    name: "Padrão 01",
    tone: "Bege acinzentado claro",
    description: "O claro que eleva o teto: veios suaves e alongados que refletem a luz e dão sensação de mais altura.",
    idealFor: ["Sala", "Quarto", "Home office"],
    texture: "/textures/teto/padrao-01.jpg",
    image: { src: "/projects/teto-01-banheiro.jpg", label: "Banheiro" },
  },
  {
    ...TETO,
    id: "teto-padrao-02",
    name: "Padrão 02",
    tone: "Mel claro",
    description: "O carvalho dourado: catedrais marcadas de ponta a ponta, natural e cheio de movimento.",
    idealFor: ["Sala de estar", "Sala de jantar", "Quarto"],
    texture: "/textures/teto/padrao-02.jpg",
    image: { src: "/projects/teto-02-sala-de-estar.jpg", label: "Sala de estar" },
  },
  {
    ...TETO,
    id: "teto-padrao-03",
    name: "Padrão 03",
    tone: "Castanho rústico",
    description: "A madeira com história: nós aparentes, fendas de veio e variações de tom de tábuas de demolição.",
    idealFor: ["Sala", "Escritório", "Espaço comercial"],
    texture: "/textures/teto/padrao-03.jpg",
    image: { src: "/projects/teto-03-restaurante.jpg", label: "Restaurante" },
  },
  {
    ...TETO,
    id: "teto-padrao-04",
    name: "Padrão 04",
    tone: "Cedro avermelhado",
    description: "O tom mais vibrante: alaranjado-avermelhado com veios finos e ondulados, para projetos tropicais e retrô.",
    idealFor: ["Sala", "Recepção", "Espaço comercial"],
    texture: "/textures/teto/padrao-04.jpg",
    image: { src: "/projects/teto-04-area-gourmet.jpg", label: "Área gourmet" },
  },
  {
    ...TETO,
    id: "teto-padrao-05",
    name: "Padrão 05",
    tone: "Castanho escuro",
    description: "O escuro que acolhe: castanho profundo, próximo da nogueira, com veios discretos e superfície uniforme.",
    idealFor: ["Quarto", "Home theater", "Sala de jantar"],
    texture: "/textures/teto/padrao-05.jpg",
    image: { src: "/projects/teto-05-escritorio.jpg", label: "Escritório" },
  },
  {
    ...TETO,
    id: "teto-padrao-06",
    name: "Padrão 06",
    tone: "Carvalho natural claro",
    description: "O natural do dia a dia: veios longos com riscos acinzentados e pequenos nós discretos.",
    idealFor: ["Sala", "Quarto", "Escritório"],
    texture: "/textures/teto/padrao-06.jpg",
    image: { src: "/projects/teto-06-banheiro.jpg", label: "Banheiro" },
  },
  {
    ...TETO,
    id: "teto-padrao-07",
    name: "Padrão 07",
    tone: "Cerejeira alaranjada",
    description: "O calor da cerejeira: laranja-cobre intenso, com veios longos e desenhos em chama.",
    idealFor: ["Sala de jantar", "Área gourmet", "Recepção"],
    texture: "/textures/teto/padrao-07.jpg",
    image: { src: "/projects/teto-07-sala-de-jantar.jpg", label: "Sala de jantar" },
  },
];

/** Nome usado nas mensagens de WhatsApp, ex.: "Château Mur Troussay (cód. 247)". */
export function productLabel(p: Product): string {
  const prefix: Record<FamilyId, string> = {
    chateau: p.collection === "Coleção Château Mur" ? "Château Mur " : p.collection.startsWith("Coronato") ? "Coronato " : "Madeira alto brilho ",
    placas: "Placa flexível ",
    "piso-colado": "Piso vinílico colado ",
    "piso-spc": "Piso vinílico SPC ",
    teto: "Teto laminado ",
  };
  return `${prefix[p.family]}${p.name}${p.code ? ` (cód. ${p.code})` : ""}`;
}

export const productsByFamily = (id: FamilyId) => products.filter((p) => p.family === id);
