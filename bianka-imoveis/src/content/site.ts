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
  src: "/bianka/retrato.jpg",
  alt: "Retrato de Bianka Rodrigues, corretora de imóveis em Manaus",
  width: 713,
  height: 894,
};

const credibility = `${EXPERIENCE_YEARS} anos de experiência · ${site.city}, ${site.state} · ${site.creci}`;

export const copy = {
  nav: [
    { label: "Sobre", href: "#sobre" },
    { label: "Imóveis", href: "#imoveis" },
    { label: "Serviços", href: "#servicos" },
    { label: "Contato", href: "#contato" },
  ],
  headerCta: "Falar com Bianka",

  hero: {
    eyebrow: "Corretora de imóveis em Manaus",
    /** O nome é o título principal da página. */
    tagline: "Seu próximo capítulo começa no imóvel certo.",
    text: `Há ${EXPERIENCE_YEARS} anos, Bianka ajuda pessoas a comprar, vender e alugar imóveis em Manaus — com atendimento direto e orientação próxima em cada etapa.`,
    primaryCta: "Falar com Bianka",
    secondaryCta: "Ver imóveis disponíveis",
    experienceLabel: "anos ajudando a realizar sonhos",
    credibility,
  },

  about: {
    eyebrow: "Sobre Bianka",
    headline: "Experiência para orientar. Proximidade para entender você.",
    paragraphs: [
      `Há ${EXPERIENCE_YEARS} anos, Bianka Rodrigues acompanha pessoas em Manaus em um dos momentos mais importantes da vida: a escolha de um novo endereço.`,
      "Venda, locação e avaliação de imóveis fazem parte do seu dia a dia. Em cada atendimento, o ponto de partida é o mesmo: ouvir com atenção o que você procura antes de indicar qualquer caminho.",
    ],
    approachTitle: "Como Bianka atende",
    approach: [
      {
        title: "Atendimento direto",
        text: "Você conversa com a própria Bianka sobre o imóvel ou o objetivo que tem em mente.",
      },
      {
        title: "Escuta antes de indicar",
        text: "Entender o que você precisa vem antes de qualquer sugestão de imóvel.",
      },
      {
        title: `${EXPERIENCE_YEARS} anos de experiência`,
        text: "Venda, locação e avaliação de imóveis em Manaus fazem parte da sua trajetória.",
      },
    ],
    facts: [
      { value: String(EXPERIENCE_YEARS), label: "anos de experiência" },
      { value: "Manaus", label: "Amazonas" },
      { value: "CRECI", label: "1259 PF" },
    ],
    cta: "Conversar com Bianka",
  },

  listings: {
    eyebrow: "Imóveis disponíveis",
    headline: "Imóveis à venda e para alugar com Bianka",
    text: "Imóveis que Bianka representa no momento. Viu algo que combina com você? Fale diretamente com ela sobre o imóvel.",
    cta: "Tenho interesse neste imóvel",
    filterAll: "Todos",
    pricePlaceholder: "Valor sob consulta",
    neighborhoodPlaceholder: "Bairro a confirmar",
    typePlaceholder: "Tipo a confirmar",
    emptyTitle: "Novos imóveis em breve.",
    emptyText: "Fale com Bianka para saber quais imóveis estão disponíveis agora.",
    emptyCta: "Perguntar sobre imóveis disponíveis",
    moreCta: "Não encontrou o que procura? Fale com Bianka",
    demoNotice:
      "Os imóveis abaixo são demonstrações do layout. As imagens não representam imóveis reais e as informações marcadas como \"a confirmar\" serão preenchidas com dados confirmados.",
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

  sold: {
    eyebrow: "Trajetória",
    headline: "Imóveis vendidos. Novos capítulos iniciados.",
    text: "Alguns imóveis que fizeram parte da trajetória de Bianka.",
    cta: "Quero encontrar um imóvel como esse",
    demoNotice: "Demonstração: estes itens não representam imóveis reais nem negociações realizadas.",
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
