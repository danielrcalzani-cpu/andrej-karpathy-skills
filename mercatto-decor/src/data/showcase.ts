// Conteúdo aprofundado de cada linha para a seção "Em destaque".
// Todos os textos resumem as páginas de apresentação, tecnologia e diferenciais dos catálogos.

import type { FamilyId } from "./collections";

export type Showcase = {
  id: FamilyId;
  /** Título com a parte final em destaque (itálico cobre). */
  title: [string, string];
  lead: string;
  story: string;
  numbers: { value: string; label: string }[];
  points: { title: string; text: string }[];
  use?: { yes: string; no: string };
};

export const showcase: Showcase[] = [
  {
    id: "piso-colado",
    title: ["Piso vinílico", "colado."],
    lead: "O visual da madeira, a leveza do vinílico.",
    story:
      "Camadas prensadas que somam só 2 ou 3 mm: uma capa de uso transparente protege o desenho, o filme decorativo traz a cor, os veios e os nós da madeira, e a base vinílica dá corpo flexível e estável. As réguas são coladas sobre o contrapiso nivelado, com instalação rápida e obra limpa.",
    numbers: [
      { value: "14", label: "Padrões em 4 linhas" },
      { value: "2 e 3 mm", label: "De espessura" },
      { value: "0,15–0,30 mm", label: "Capa de uso" },
      { value: "Colada", label: "Instalação" },
    ],
    points: [
      { title: "Espessura mínima", text: "Quase não altera o nível do piso: portas e rodapés pedem menos ajustes." },
      { title: "Menos ruído, mais conforto", text: "Passos mais baixos que na cerâmica, sem a sensação de chão frio." },
      { title: "Capa de uso por linha", text: "0,15 mm na Nobiltà, 0,20 mm na Paesaggi e na Realeza, 0,30 mm na Sole." },
      { title: "Limpeza fácil", text: "Vassoura macia ou aspirador e pano úmido com detergente neutro." },
    ],
    use: {
      yes: "Salas, quartos, escritórios, closets e corredores: ambientes internos de uso residencial.",
      no: "Áreas externas, boxes de banheiro e locais com água parada ou sol forte e direto o dia todo.",
    },
  },
  {
    id: "piso-spc",
    title: ["Piso vinílico", "SPC."],
    lead: "A beleza da madeira, a praticidade do vinílico.",
    story:
      "SPC (Stone Plastic Composite) é um piso vinílico de núcleo rígido, de PVC virgem e mineral: estável, firme e à prova d’água. As réguas se unem pelo sistema Uniclic, produzido sob licença da Unilin Technologies, e o ClickControl faz cada junta fechar no ponto certo. Por baixo, a manta acústica Vexa abafa o som dos passos.",
    numbers: [
      { value: "4", label: "Padrões em 2 linhas" },
      { value: "0,23 × 1,40 m", label: "Por régua" },
      { value: "0,30–0,50 mm", label: "Capa de uso" },
      { value: "1 clique", label: "Instalação Uniclic" },
    ],
    points: [
      { title: "À prova d’água", text: "O núcleo rígido não incha com água: pode ir para cozinhas e lavanderias." },
      { title: "Sem cola, sem argamassa", text: "O encaixe dispensa cola; o ambiente volta ao uso logo após a instalação." },
      { title: "Microvinco", text: "Chanfro sutil nas bordas marca cada régua, como em um assoalho de madeira." },
      { title: "Tráfego intenso", text: "Para uso residencial intenso e comercial geral: casas movimentadas, lojas e escritórios." },
    ],
  },
  {
    id: "placas",
    title: ["Placas de revestimento", "flexível."],
    lead: "Transforme paredes sem complicações.",
    story:
      "Uma placa de fibra de bambu revestida com filme de PVC de alta resolução: o visual do mármore, do linho, do espelhado e de efeitos especiais em um material leve, resistente e simples de instalar. Ela pode ser dobrada e moldada, acompanhando cantos e curvas.",
    numbers: [
      { value: "11", label: "Padrões em 3 coleções" },
      { value: "2,90 × 1,22 m", label: "Por placa" },
      { value: "3,54 m²", label: "Área por placa" },
      { value: "3 mm", label: "De espessura" },
    ],
    points: [
      { title: "Resistente à água", text: "Pode ser instalada em áreas úmidas, como cozinhas e banheiros." },
      { title: "Anti-riscos", text: "Filme de PVC resistente ao desgaste do dia a dia." },
      { title: "Resistente ao fogo", text: "Material resistente ao fogo, conforme especificação do fabricante." },
      { title: "Sem quebra-quebra", text: "Reforma rápida, limpa e sem sujeira. Basta colar." },
    ],
  },
  {
    id: "chateau",
    title: ["Château", "Mur."],
    lead: "Grandes formatos, poucas emendas.",
    story:
      "Revestimento vinílico de parede em placas de 2,80 × 0,92 m: uma única peça vai do rodapé ao teto em paredes de pé-direito comum, sem emenda horizontal. A placa é colada sobre a parede existente, limpa, seca e nivelada. Sem demolição, sem rejunte e com pouca sujeira.",
    numbers: [
      { value: "2,80 × 0,92 m", label: "Formato da placa" },
      { value: "2,58 m²", label: "Por placa" },
      { value: "2 mm", label: "De espessura" },
      { value: "5,16 m²", label: "Por caixa · 02 placas" },
    ],
    points: [
      { title: "Resistente à água", text: "Resistente à água e à umidade; pode ser usado em ambientes úmidos." },
      { title: "Não propaga chama", text: "Composição que não propaga chama, conforme o fabricante." },
      { title: "Matéria-prima virgem", text: "100% virgem, sem metais pesados ou Bisfenol A. Norma REACH – ECHA." },
      { title: "Ensaios", text: "Testes e ensaios conforme a norma ABNT NBR 14917." },
    ],
  },
  {
    id: "teto",
    title: ["Teto", "laminado."],
    lead: "O teto também decora.",
    story:
      "O teto é a superfície que mais aparece quando você entra num ambiente, deita na cama ou se acomoda no sofá, e ainda assim costuma ser a última lembrada na reforma. Com o teto laminado, ele deixa de ser um plano branco e passa a fazer parte da decoração, com o calor e o desenho da madeira.",
    numbers: [
      { value: "8", label: "Padrões" },
      { value: "Amadeirado", label: "Acabamento" },
      { value: "Claro ao escuro", label: "Tons" },
      { value: "Sob consulta", label: "Medidas" },
    ],
    points: [
      {
        title: "Tons claros",
        text: "Sandal Pinus, Carvalho, Carvalho Natural e Amêndoa refletem a luz e parecem “subir” o teto: boa escolha para pé-direito baixo e ambientes pequenos.",
      },
      {
        title: "Tons médios",
        text: "Maple, Mogno e Nogueira Mel aquecem o ambiente sem pesar e funcionam bem com paredes claras e pisos neutros.",
      },
      {
        title: "Tom escuro",
        text: "Pinewood abraça o espaço e cria aconchego e contraste. Rende mais com pé-direito generoso e iluminação bem planejada.",
      },
      {
        title: "Teto e piso conversando",
        text: "No mesmo tom, criam uma caixa de madeira contínua; em tons contrastantes, cada plano ganha destaque.",
      },
    ],
  },
];
