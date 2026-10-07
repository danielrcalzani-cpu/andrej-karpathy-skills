// Famílias de produto da Mercatto Decor. Fonte: catálogos edição 2026.
// Dados técnicos copiados das fichas técnicas; "Sob consulta" onde o catálogo assim indica.

export type FamilyId = "piso-colado" | "piso-spc" | "placas" | "chateau" | "teto";

export type Family = {
  id: FamilyId;
  name: string;
  surface: "Piso" | "Parede" | "Teto";
  kicker: string;
  summary: string;
  image: string;
  imageAlt: string;
  catalogId: string;
  specs: { label: string; value: string }[];
  highlights: string[];
};

export const families: Family[] = [
  {
    id: "piso-colado",
    name: "Piso vinílico colado",
    surface: "Piso",
    kicker: "14 padrões · 4 linhas",
    summary:
      "O desenho e a cor da madeira em apenas 2 ou 3 mm. Colado sobre o contrapiso nivelado, com instalação rápida e obra limpa: mais confortável e silencioso que a cerâmica.",
    image: "/projects/piso-toscana-sala.jpg",
    imageAlt: "Sala de estar com piso vinílico colado padrão Toscana, Linha Sole",
    catalogId: "piso-vinilico-colado",
    specs: [
      { label: "Espessura", value: "2 mm · 3 mm no Toscana" },
      { label: "Capa de uso", value: "0,15 a 0,30 mm" },
      { label: "Instalação", value: "Colada sobre o contrapiso" },
      { label: "Uso", value: "Residencial · ambientes internos" },
    ],
    highlights: ["Nobiltà", "Paesaggi", "Realeza", "Sole"],
  },
  {
    id: "piso-spc",
    name: "Piso vinílico SPC",
    surface: "Piso",
    kicker: "4 padrões · clique Uniclic",
    summary:
      "Núcleo rígido à prova d’água, encaixe por clique sem cola e manta acústica Vexa. Réguas longas de 1,40 m com microvinco nas bordas, como um assoalho de madeira.",
    image: "/projects/spc-serras-lounge.jpg",
    imageAlt: "Espaço de convivência com piso vinílico SPC em madeira castanha",
    catalogId: "piso-vinilico-spc",
    specs: [
      { label: "Régua", value: "0,23 × 1,40 m · 0,322 m²" },
      { label: "Capa de uso", value: "0,30 mm · 0,50 mm no Freijó" },
      { label: "Instalação", value: "Clique Uniclic, sem cola" },
      { label: "Uso", value: "Residencial intenso e comercial geral" },
    ],
    highlights: ["Linha Serras", "Madeiras Brasileiras"],
  },
  {
    id: "placas",
    name: "Placas de revestimento flexível",
    surface: "Parede",
    kicker: "11 padrões · 3 coleções",
    summary:
      "Fibra de bambu revestida com filme de PVC de alta resolução: mármores, linhos e efeitos especiais em placas leves que se dobram, acompanham curvas e se instalam sem quebra-quebra.",
    image: "/projects/placas-marmore-sala.jpg",
    imageAlt: "Parede revestida com placa flexível efeito mármore branco atrás de um sofá amarelo",
    catalogId: "placas-revestimento-flexivel",
    specs: [
      { label: "Placa", value: "2,90 × 1,22 m · 3,54 m²" },
      { label: "Espessura", value: "3 mm" },
      { label: "Instalação", value: "Colada sobre a parede" },
      { label: "Uso", value: "Ambientes internos, inclusive úmidos" },
    ],
    highlights: ["Mármores", "Linhos & Texturas", "Lisos & Especiais"],
  },
  {
    id: "chateau",
    name: "Château Mur",
    surface: "Parede",
    kicker: "Revestimento vinílico de parede",
    summary:
      "Placas vinílicas de 2,80 × 0,92 m: uma única peça vai do rodapé ao teto em paredes de pé-direito comum. Efeitos pedra, mármore e madeira, com poucas emendas.",
    image: "/projects/chateau-quarto.jpg",
    imageAlt: "Quarto com parede de cabeceira revestida em Château Mur efeito madeira",
    catalogId: "chateau-mur",
    specs: [
      { label: "Placa", value: "2,80 × 0,92 m · 2,58 m²" },
      { label: "Espessura", value: "2 mm" },
      { label: "Caixa", value: "02 placas · 5,16 m²" },
      { label: "Normas", value: "REACH – ECHA · ABNT NBR 14917" },
    ],
    highlights: ["Coleção Château Mur", "Coronato · Pedras", "Madeiras alto brilho"],
  },
  {
    id: "teto",
    name: "Teto laminado",
    surface: "Teto",
    kicker: "7 padrões · claro ao escuro",
    summary:
      "O calor e o desenho da madeira levados para o alto. Do bege claro ao castanho profundo, o teto deixa de ser um plano branco e passa a fazer parte da decoração.",
    image: "/projects/teto-02-sala-de-estar.jpg",
    imageAlt: "Sala de estar ampla com teto laminado em madeira mel claro",
    catalogId: "teto-laminado",
    specs: [
      { label: "Padrões", value: "07, do claro ao escuro" },
      { label: "Acabamento", value: "Amadeirado" },
      { label: "Medidas", value: "Sob consulta" },
      { label: "Cálculo", value: "Área do teto + 10%" },
    ],
    highlights: ["Tons claros", "Tons médios", "Tons escuros"],
  },
];

export const familyById = Object.fromEntries(families.map((f) => [f.id, f])) as Record<FamilyId, Family>;
