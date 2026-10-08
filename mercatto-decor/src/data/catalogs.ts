// Catálogos em PDF publicados em /public/catalogos (arquivos originais da Mercatto Decor).

export type Catalog = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  file: string;
  cover: string;
  pages: number;
  size: string;
};

export const catalogs: Catalog[] = [
  {
    id: "chateau-mur",
    title: "Château Mur",
    subtitle: "Guia de especificação",
    description: "Padrões, escala real, paginação da parede, cálculo de placas e ficha técnica.",
    file: "/catalogos/mercatto-decor-chateau-mur.pdf",
    cover: "/catalogs-covers/chateau-mur.jpg",
    pages: 17,
    size: "2,5 MB",
  },
  {
    id: "placas-revestimento-flexivel",
    title: "Placas de Revestimento Flexível",
    subtitle: "Catálogo de produtos · 11 padrões",
    description: "Mármores, linhos e efeitos especiais, com comparativo, instalação e cálculo.",
    file: "/catalogos/mercatto-decor-placas-revestimento-flexivel.pdf",
    cover: "/catalogs-covers/placas-revestimento-flexivel.jpg",
    pages: 19,
    size: "3,1 MB",
  },
  {
    id: "piso-vinilico-colado",
    title: "Piso Vinílico Colado",
    subtitle: "Catálogo de pisos · 14 padrões",
    description: "As linhas Nobiltà, Paesaggi, Realeza e Sole, com instalação, cálculo e cuidados.",
    file: "/catalogos/mercatto-decor-piso-vinilico-colado.pdf",
    cover: "/catalogs-covers/piso-vinilico-colado.jpg",
    pages: 21,
    size: "17,8 MB",
  },
  {
    id: "piso-vinilico-spc",
    title: "Piso Vinílico Clicado SPC",
    subtitle: "Catálogo de pisos · 4 padrões",
    description: "Linha Serras e Madeiras Brasileiras, tecnologia SPC, escala real e cálculo de réguas.",
    file: "/catalogos/mercatto-decor-piso-vinilico-spc.pdf",
    cover: "/catalogs-covers/piso-vinilico-spc.jpg",
    pages: 15,
    size: "7,3 MB",
  },
  {
    id: "teto-laminado",
    title: "Teto Laminado",
    subtitle: "Catálogo de tetos · 8 padrões",
    description: "Do bege claro ao castanho profundo, com dicas para escolher e planejar o teto.",
    file: "/catalogos/mercatto-decor-teto-laminado.pdf",
    cover: "/catalogs-covers/teto-laminado.jpg",
    pages: 14,
    size: "12,9 MB",
  },
];
