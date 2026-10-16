/**
 * Conteúdo central do site — edite aqui as informações da Bianka.
 * Os componentes leem tudo deste arquivo; não é preciso mexer no layout.
 */

/** Anos de experiência. Atualize este número e todo o site acompanha. */
export const EXPERIENCE_YEARS = 22;

export const site = {
  brand: "Bianka Rodrigues Imóveis",
  name: "Bianka Rodrigues",
  descriptor: "Imóveis",
  role: "Corretora de imóveis",
  city: "Manaus",
  state: "AM",
  creci: "CRECI 1259 PF",
  experienceYears: EXPERIENCE_YEARS,
  services: ["Venda", "Locação", "Avaliação de imóveis"],

  /** Número no formato internacional, apenas dígitos (usado no link wa.me). */
  whatsappNumber: "5592984231601",
  /** Exibição do telefone para leitura humana. */
  phoneDisplay: "(92) 98423-1601",
  instagramUrl: "https://www.instagram.com/bianka.imoveis/",
  instagramHandle: "@bianka.imoveis",

  /**
   * URL pública do site (usada em SEO / Open Graph).
   * Defina NEXT_PUBLIC_SITE_URL no ambiente de produção.
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * Retrato da Bianka. Enquanto `src` for null, o site mostra um espaço
 * reservado elegante. Para usar uma foto: coloque o arquivo em
 * `public/bianka/` e preencha os campos abaixo com as dimensões reais.
 */
export const portrait: {
  src: string | null;
  alt: string;
  width: number;
  height: number;
} = {
  src: null, // ex.: "/bianka/retrato.jpg"
  alt: "Retrato de Bianka Rodrigues, corretora de imóveis em Manaus",
  width: 1200,
  height: 1500,
};

/**
 * Imagem grande do topo da página. Enquanto `src` for null, é exibida uma
 * ilustração arquitetônica. Use uma foto horizontal ou vertical de boa
 * resolução (mín. 1600px no lado maior) em `public/hero/`.
 */
export const heroImage: {
  src: string | null;
  alt: string;
  width: number;
  height: number;
} = {
  src: null, // ex.: "/hero/fachada.jpg"
  alt: "",
  width: 1600,
  height: 2000,
};

const credibility = `${EXPERIENCE_YEARS} anos de experiência · ${site.city}, ${site.state} · ${site.creci}`;

export const copy = {
  nav: [
    { label: "Sobre", href: "#sobre" },
    { label: "Serviços", href: "#servicos" },
    { label: "Imóveis vendidos", href: "#imoveis-vendidos" },
    { label: "Contato", href: "#contato" },
  ],
  headerCta: "Falar com Bianka",

  hero: {
    eyebrow: "Bianka Rodrigues · Imóveis em Manaus",
    headline: "Seu próximo capítulo começa no imóvel certo.",
    /** Trecho do título exibido em itálico (deve existir dentro do título). */
    headlineEmphasis: "imóvel certo.",
    text: `Há ${EXPERIENCE_YEARS} anos, ajudando pessoas a comprar, vender e alugar imóveis em Manaus com orientação próxima em cada etapa.`,
    primaryCta: "Quero encontrar meu imóvel",
    secondaryCta: "Quero vender meu imóvel",
    credibility,
  },

  about: {
    eyebrow: "Sobre Bianka",
    headline: "Experiência para orientar. Proximidade para entender você.",
    paragraphs: [
      `Há ${EXPERIENCE_YEARS} anos, Bianka Rodrigues acompanha pessoas em Manaus em um dos momentos mais importantes da vida: a escolha de um novo endereço.`,
      "Venda, locação e avaliação de imóveis fazem parte do seu dia a dia. Em cada atendimento, o ponto de partida é o mesmo: ouvir com atenção o que você procura antes de indicar qualquer caminho.",
      "Aqui você fala diretamente com ela. Conte seu objetivo — comprar, vender ou alugar — e receba orientação de quem conhece o mercado da cidade.",
    ],
    facts: [
      { value: String(EXPERIENCE_YEARS), label: "anos de experiência" },
      { value: "Manaus", label: "Amazonas" },
      { value: "CRECI", label: "1259 PF" },
    ],
    cta: "Conversar com Bianka",
  },

  services: {
    eyebrow: "Serviços",
    headline: "Como posso ajudar você.",
    items: [
      {
        id: "comprar",
        title: "Comprar um imóvel",
        text: "Converse sobre o que você procura e dê o próximo passo na busca pelo seu novo endereço.",
        cta: "Quero comprar",
        intent: "comprar",
      },
      {
        id: "vender",
        title: "Vender ou alugar",
        text: "Conte com orientação para apresentar seu imóvel e conversar sobre as possibilidades de negociação.",
        cta: "Quero anunciar meu imóvel",
        intent: "anunciar",
      },
      {
        id: "avaliacao",
        title: "Avaliação de imóveis",
        text: "Entenda melhor o posicionamento do seu imóvel no mercado de Manaus.",
        cta: "Solicitar avaliação",
        intent: "avaliacao",
      },
    ],
    rentalNote: "Procura um imóvel para alugar?",
    rentalCta: "Falar sobre locação",
  },

  portfolio: {
    eyebrow: "Trajetória",
    headline: "Imóveis vendidos. Novos capítulos iniciados.",
    text: "Conheça alguns dos imóveis que fizeram parte dessa trajetória.",
    cta: "Quero encontrar um imóvel como esses",
    demoNotice:
      "Os itens abaixo são demonstrações do layout. As imagens não representam imóveis reais nem negociações realizadas.",
  },

  process: {
    eyebrow: "Como funciona",
    headline: "Uma conversa para começar. Orientação para seguir.",
    steps: [
      {
        title: "Conte o que você precisa",
        text: "Pelo WhatsApp, você fala diretamente com Bianka sobre seu objetivo.",
      },
      {
        title: "Receba orientação para o seu objetivo",
        text: "Comprar, vender, alugar ou avaliar: cada caso recebe um caminho próprio.",
      },
      {
        title: "Avance com acompanhamento",
        text: "Você segue com alguém ao seu lado nas próximas etapas.",
      },
    ],
  },

  final: {
    headline: "Vamos conversar sobre o seu próximo imóvel?",
    text: "Seja para comprar, vender ou alugar em Manaus, o primeiro passo é entender o que você precisa.",
    primaryCta: "Falar com Bianka no WhatsApp",
    secondaryCta: "Conhecer o Instagram",
  },

  seo: {
    title: "Bianka Rodrigues Imóveis · Corretora de imóveis em Manaus",
    description: `Compra, venda, locação e avaliação de imóveis em Manaus com Bianka Rodrigues. ${EXPERIENCE_YEARS} anos de experiência · ${site.creci}. Fale diretamente pelo WhatsApp.`,
  },
} as const;
