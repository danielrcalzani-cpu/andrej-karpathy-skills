/**
 * Imóveis da Bianka — edite apenas este arquivo para adicionar ou remover
 * imóveis, fotos e vídeos. Veja o passo a passo completo no README.md.
 *
 * - status "venda" ou "aluguel": aparece em "Imóveis à venda e para alugar com Bianka",
 *   com o botão "Tenho interesse neste imóvel".
 * - status "vendido": aparece na seção menor de imóveis já vendidos.
 *
 * Regras de conteúdo:
 * - Use apenas informações confirmadas pela Bianka. Campos não preenchidos
 *   aparecem no site como "a confirmar" / "sob consulta" — nunca invente.
 * - Não informe endereço completo.
 * - Todos os campos de texto são opcionais, exceto `photos` (mín. 1 foto).
 */

/**
 * Exibe os itens de demonstração (`isDemo: true`).
 * Antes de publicar, mude para `false`. Sem imóveis vendidos reais, a seção
 * de vendidos some; sem imóveis disponíveis, aparece um convite para conversar.
 */
export const SHOW_DEMO_PROPERTIES = true;

export type PropertyStatus = "venda" | "aluguel" | "vendido";

export const statusLabel: Record<PropertyStatus, string> = {
  venda: "À venda",
  aluguel: "Para alugar",
  vendido: "Vendido",
};

export type PropertyPhoto = {
  /** Caminho a partir de /public, ex.: "/imoveis/casa-ponta-negra/01.jpg" */
  src: string;
  /** Descrição curta da foto, para acessibilidade. */
  alt: string;
  /** Dimensões reais do arquivo, em pixels (mantém a proporção correta). */
  width: number;
  height: number;
};

export type PropertyVideo =
  | {
      /** Arquivo MP4 local em /public. */
      type: "file";
      src: string;
      /** Opcional: versão WebM do mesmo vídeo, para navegadores sem suporte a MP4/H.264. */
      srcWebm?: string;
      /** Imagem exibida antes do play (obrigatória, evita baixar o vídeo). */
      poster: string;
      width: number;
      height: number;
    }
  | {
      type: "youtube";
      /** ID do vídeo — ex.: em youtube.com/watch?v=ABC123, o ID é "ABC123". */
      id: string;
      poster: string;
      width: number;
      height: number;
    }
  | {
      type: "vimeo";
      /** ID numérico — ex.: em vimeo.com/123456, o ID é "123456". */
      id: string;
      poster: string;
      width: number;
      height: number;
    };

export type Property = {
  /** Código único do imóvel; vai na mensagem do WhatsApp para identificá-lo. */
  id: string;
  status: PropertyStatus;
  /** Marca o item como demonstração (rótulo "Demonstração" sempre visível). */
  isDemo?: boolean;
  title?: string;
  neighborhood?: string;
  propertyType?: string;
  /** Valor exatamente como confirmado, ex.: "R$ 3.350 + caução". Vazio = "Valor sob consulta". */
  price?: string;
  description?: string;
  /** Ex.: ["3 quartos", "1 suíte", "Área de lazer"] */
  specs?: string[];
  photos: [PropertyPhoto, ...PropertyPhoto[]];
  /** Vídeo tour opcional. */
  video?: PropertyVideo;
};

const demo = (name: string) => `/portfolio/demo/${name}`;
const demoVideo: PropertyVideo = {
  type: "file",
  src: demo("demo-1-video.mp4"),
  srcWebm: demo("demo-1-video.webm"),
  poster: demo("demo-1-video-poster.jpg"),
  width: 720,
  height: 1280,
};

export const properties: Property[] = [
  /*
   * EXEMPLO DE IMÓVEL REAL (copie, descomente e preencha):
   *
   * {
   *   id: "casa-ponta-negra",
   *   status: "venda",               // "venda" | "aluguel" | "vendido"
   *   title: "Casa em condomínio",
   *   neighborhood: "Ponta Negra",
   *   propertyType: "Casa",
   *   price: "R$ 000.000",           // deixe sem para mostrar "Valor sob consulta"
   *   description: "Casa térrea com área de lazer.",
   *   specs: ["3 quartos", "1 suíte"],
   *   photos: [
   *     { src: "/imoveis/casa-ponta-negra/01.jpg", alt: "Fachada da casa", width: 1600, height: 1067 },
   *     { src: "/imoveis/casa-ponta-negra/02.jpg", alt: "Sala de estar", width: 1080, height: 1350 },
   *   ],
   *   // Vídeo tour opcional — escolha UM dos formatos:
   *   video: { type: "file", src: "/imoveis/casa-ponta-negra/tour.mp4", poster: "/imoveis/casa-ponta-negra/tour-capa.jpg", width: 1080, height: 1920 },
   *   // video: { type: "youtube", id: "ID_DO_VIDEO", poster: "/imoveis/casa-ponta-negra/tour-capa.jpg", width: 1920, height: 1080 },
   *   // video: { type: "vimeo", id: "123456789", poster: "/imoveis/casa-ponta-negra/tour-capa.jpg", width: 1920, height: 1080 },
   * },
   */

  // ——— Itens de demonstração (desative com SHOW_DEMO_PROPERTIES) ———
  // Campos como bairro e valor ficam vazios de propósito: o site mostra os
  // textos de "a confirmar" até que informações reais sejam cadastradas.
  {
    id: "demo-venda-1",
    status: "venda",
    isDemo: true,
    title: "Exemplo de casa à venda com vídeo tour",
    propertyType: "Casa",
    description: "Item de demonstração para visualizar fotos e vídeo tour de um imóvel à venda.",
    photos: [
      { src: demo("demo-1-fachada.jpg"), alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: demo("demo-1-sala.jpg"), alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
      { src: demo("demo-1-detalhe.jpg"), alt: "Ilustração vertical de demonstração de um ambiente", width: 1080, height: 1350 },
    ],
    video: demoVideo,
  },
  {
    id: "demo-aluguel-1",
    status: "aluguel",
    isDemo: true,
    title: "Exemplo de apartamento para alugar",
    propertyType: "Apartamento",
    photos: [
      { src: demo("demo-4-fachada.jpg"), alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: demo("demo-4-sala.jpg"), alt: "Ilustração vertical de demonstração de uma sala", width: 1080, height: 1350 },
    ],
  },
  {
    id: "demo-venda-2",
    status: "venda",
    isDemo: true,
    title: "Exemplo de imóvel à venda",
    photos: [
      { src: demo("demo-5-fachada.jpg"), alt: "Ilustração vertical de demonstração de uma fachada", width: 1080, height: 1350 },
      { src: demo("demo-5-sala.jpg"), alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
    ],
  },
  {
    id: "demo-aluguel-2",
    status: "aluguel",
    isDemo: true,
    title: "Exemplo de casa para alugar com vídeo tour",
    propertyType: "Casa",
    photos: [
      { src: demo("demo-6-fachada.jpg"), alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: demo("demo-6-sala.jpg"), alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
    ],
    video: demoVideo,
  },
  {
    id: "demo-vendido-1",
    status: "vendido",
    isDemo: true,
    title: "Exemplo de imóvel vendido",
    photos: [
      { src: demo("demo-2-fachada.jpg"), alt: "Ilustração vertical de demonstração de uma fachada", width: 1080, height: 1350 },
      { src: demo("demo-2-sala.jpg"), alt: "Ilustração vertical de demonstração de uma sala", width: 1080, height: 1350 },
    ],
  },
  {
    id: "demo-vendido-2",
    status: "vendido",
    isDemo: true,
    title: "Exemplo de imóvel vendido",
    photos: [
      { src: demo("demo-3-fachada.jpg"), alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: demo("demo-3-sala.jpg"), alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
    ],
  },
];

const visible = properties.filter((p) => !p.isDemo || SHOW_DEMO_PROPERTIES);

/** Imóveis disponíveis (à venda ou para alugar) exibidos no site. */
export const listings = visible.filter((p) => p.status !== "vendido");
/** Imóveis já vendidos exibidos na seção de trajetória. */
export const soldProperties = visible.filter((p) => p.status === "vendido");
