import Image from "next/image";
import Reveal from "./Reveal";

const verbs = [
  { title: "Ver", text: "Amostras físicas na loja e catálogos com cada padrão em detalhe." },
  { title: "Comparar", text: "Tons do claro ao escuro, lado a lado, por efeito e por ambiente." },
  { title: "Planejar", text: "Paginação, sentido das peças e cálculo de quantidade antes da obra." },
  { title: "Especificar", text: "Código do padrão, quantidade e lote: o pedido sai certo." },
];

export default function IntroStatement() {
  return (
    <section id="conteudo" aria-labelledby="intro-title" className="overflow-hidden bg-paper py-16 md:py-36">
      <div className="container-x grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6 lg:pt-6">
          <Reveal>
            <p className="eyebrow text-copper-deep">Mercatto Decor · Manaus</p>
            <h2 id="intro-title" className="display mt-6 text-[2.5rem] sm:text-5xl xl:text-[4rem]">
              A primeira coisa que se vê num ambiente é a <em>superfície.</em>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-8 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft">
              Reunimos materiais para piso, parede e teto: pisos vinílicos com o desenho da madeira, placas que levam mármore e
              linho para a parede, Château Mur em grande formato e teto laminado em oito tons. Superfícies escolhidas para mudar a
              leitura de um espaço — com menos obra para chegar lá.
            </p>
          </Reveal>
        </div>

        <div className="relative lg:col-span-6">
          <Reveal variant="image" className="relative ml-auto aspect-[4/5] w-[86%] overflow-hidden lg:w-[82%]">
            <Image
              src="/projects/chateau-banheiro.jpg"
              alt="Banheiro com parede revestida em Château Mur efeito mármore e bancada em madeira"
              fill
              sizes="(min-width: 1024px) 40vw, 86vw"
              className="object-cover"
            />
          </Reveal>
          <Reveal
            variant="image"
            delay={250}
            className="absolute -bottom-10 left-0 aspect-square w-[44%] overflow-hidden border-[10px] border-paper sm:w-[38%] lg:-left-6"
          >
            <Image
              src="/textures/chateau/247-troussay.jpg"
              alt="Detalhe da textura Château Mur Troussay: mármore branco com veios cinza e dourados"
              fill
              sizes="(min-width: 1024px) 18vw, 44vw"
              className="object-cover"
            />
          </Reveal>
          <p className="mt-4 text-right text-xs text-stone">Château Mur · detalhe Troussay, cód. 247</p>
        </div>
      </div>

      <div className="container-x mt-16 md:mt-32">
        <ol className="grid border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {verbs.map((v, i) => (
            <Reveal as="li" key={v.title} delay={i * 100} className="border-b border-ink/15 py-8 sm:pr-8 lg:border-b-0">
              <h3 className="font-serif text-3xl">{v.title}</h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">{v.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
