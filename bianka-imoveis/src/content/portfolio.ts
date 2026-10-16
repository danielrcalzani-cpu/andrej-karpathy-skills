/**
 * Portfólio de imóveis vendidos — edite apenas este arquivo para adicionar
 * fotos e vídeos. Veja o passo a passo completo no README.md.
 *
 * Regras de conteúdo:
 * - Cadastre somente imóveis efetivamente vendidos pela Bianka.
 * - Não informe preço, endereço completo ou dados que não tenham sido confirmados.
 * - Todos os campos de texto são opcionais, exceto `photos` (mín. 1 foto).
 */

/**
 * Exibe os itens de demonstração (`isDemo: true`).
 * Antes de publicar, mude para `false`. Se não houver nenhum item real,
 * a seção "Imóveis vendidos" some do site automaticamente.
 */
export const SHOW_DEMO_PORTFOLIO = true;

export type PortfolioPhoto = {
  /** Caminho a partir de /public, ex.: "/portfolio/ponta-negra/01.jpg" */
  src: string;
  /** Descrição curta da foto, para acessibilidade. */
  alt: string;
  /** Dimensões reais do arquivo, em pixels (mantém a proporção correta). */
  width: number;
  height: number;
};

export type PortfolioVideo =
  | {
      /** Arquivo MP4 local em /public. */
      type: "file";
      src: string;
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

export type PortfolioItem = {
  id: string;
  /** Somente imóveis vendidos entram nesta seção. */
  status: "vendido";
  /** Marca o item como demonstração (nunca exibido como "Vendido"). */
  isDemo?: boolean;
  title?: string;
  neighborhood?: string;
  propertyType?: string;
  description?: string;
  /** Ex.: ["3 quartos", "1 suíte", "Área de lazer"] */
  specs?: string[];
  photos: [PortfolioPhoto, ...PortfolioPhoto[]];
  video?: PortfolioVideo;
};

export const portfolio: PortfolioItem[] = [
  /*
   * EXEMPLO DE ITEM REAL (copie, descomente e preencha):
   *
   * {
   *   id: "casa-ponta-negra",
   *   status: "vendido",
   *   title: "Casa em condomínio",
   *   neighborhood: "Ponta Negra",
   *   propertyType: "Casa",
   *   description: "Casa térrea com área de lazer.",
   *   specs: ["3 quartos", "1 suíte"],
   *   photos: [
   *     { src: "/portfolio/casa-ponta-negra/01.jpg", alt: "Fachada da casa", width: 1600, height: 1067 },
   *     { src: "/portfolio/casa-ponta-negra/02.jpg", alt: "Sala de estar", width: 1080, height: 1350 },
   *   ],
   *   // Vídeo opcional — escolha UM dos formatos:
   *   video: { type: "file", src: "/portfolio/casa-ponta-negra/tour.mp4", poster: "/portfolio/casa-ponta-negra/tour-capa.jpg", width: 1080, height: 1920 },
   *   // video: { type: "youtube", id: "ID_DO_VIDEO", poster: "/portfolio/casa-ponta-negra/tour-capa.jpg", width: 1920, height: 1080 },
   *   // video: { type: "vimeo", id: "123456789", poster: "/portfolio/casa-ponta-negra/tour-capa.jpg", width: 1920, height: 1080 },
   * },
   */

  // ——— Itens de demonstração (remova ou desative com SHOW_DEMO_PORTFOLIO) ———
  {
    id: "demo-1",
    status: "vendido",
    isDemo: true,
    title: "Exemplo de casa com vídeo",
    propertyType: "Casa · demonstração",
    description:
      "Item de demonstração para visualizar o layout com várias fotos e um vídeo vertical.",
    specs: ["Exemplo de especificação", "Outro exemplo"],
    photos: [
      { src: "/portfolio/demo/demo-1-fachada.jpg", alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: "/portfolio/demo/demo-1-sala.jpg", alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
      { src: "/portfolio/demo/demo-1-detalhe.jpg", alt: "Ilustração vertical de demonstração de um ambiente", width: 1080, height: 1350 },
    ],
    video: {
      type: "file",
      src: "/portfolio/demo/demo-1-video.mp4",
      poster: "/portfolio/demo/demo-1-video-poster.jpg",
      width: 720,
      height: 1280,
    },
  },
  {
    id: "demo-2",
    status: "vendido",
    isDemo: true,
    title: "Exemplo com fotos verticais",
    propertyType: "Apartamento · demonstração",
    description: "Item de demonstração com fotos no formato vertical.",
    photos: [
      { src: "/portfolio/demo/demo-2-fachada.jpg", alt: "Ilustração vertical de demonstração de uma fachada", width: 1080, height: 1350 },
      { src: "/portfolio/demo/demo-2-sala.jpg", alt: "Ilustração vertical de demonstração de uma sala", width: 1080, height: 1350 },
    ],
  },
  {
    id: "demo-3",
    status: "vendido",
    isDemo: true,
    title: "Exemplo com fotos horizontais",
    propertyType: "Casa · demonstração",
    photos: [
      { src: "/portfolio/demo/demo-3-fachada.jpg", alt: "Ilustração de demonstração de uma fachada", width: 1600, height: 1067 },
      { src: "/portfolio/demo/demo-3-sala.jpg", alt: "Ilustração de demonstração de uma sala", width: 1600, height: 1067 },
    ],
  },
];

/** Itens que de fato aparecem no site, conforme a configuração acima. */
export const visiblePortfolio = portfolio.filter(
  (item) => item.status === "vendido" && (!item.isDemo || SHOW_DEMO_PORTFOLIO),
);
