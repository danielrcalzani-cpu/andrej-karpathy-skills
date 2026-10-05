import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";
import QuantityCalculator from "./QuantityCalculator";
import { WhatsAppIcon } from "./Icons";
import { whatsappUrl } from "@/lib/whatsapp";

const steps = [
  { title: "Escolha o ambiente", text: "Sala, quarto, cozinha, banheiro, escritório ou espaço comercial.", href: "#ambientes", cta: "Ver ambientes" },
  { title: "Escolha o efeito", text: "Madeira, mármore, pedra, linho, liso, espelhado ou pastilha.", href: "#materiais", cta: "Ver texturas" },
  { title: "Escolha o padrão", text: "Compare os tons lado a lado e anote o código ou o nome do padrão.", href: "#colecoes", cta: "Ver padrões" },
  { title: "Calcule a quantidade", text: "Use a calculadora com as regras de cálculo de cada catálogo.", href: "#calculadora", cta: "Calcular" },
  { title: "Solicite o orçamento", text: "Envie padrão e quantidade pelo WhatsApp. Nossa equipe cuida do resto.", href: "", cta: "" },
];

export default function HowItWorks() {
  return (
    <section id="como-escolher" aria-labelledby="como-title" className="bg-sand py-24 md:py-36">
      <div className="container-x">
        <SectionHeading
          id="como-title"
          index="07"
          eyebrow="Guia rápido"
          title={
            <>
              Como escolher <em>em 5 passos.</em>
            </>
          }
          intro="O mesmo roteiro dos nossos catálogos, aqui no site. No fim, o orçamento sai com o padrão e a quantidade certos."
        />

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-12">
          <ol className="lg:col-span-6">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.title} delay={i * 70} className="grid grid-cols-[3.5rem_1fr] border-t border-ink/15 py-6 last:border-b">
                <span className="font-serif text-3xl text-copper">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="font-serif text-2xl">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
                  {s.href ? (
                    <a href={s.href} className="link-line mt-3 inline-block pb-0.5 text-xs font-medium uppercase tracking-[0.16em]">
                      {s.cta}
                    </a>
                  ) : (
                    <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-ink mt-4">
                      <WhatsAppIcon className="h-4 w-4" />
                      Falar no WhatsApp
                    </a>
                  )}
                </div>
              </Reveal>
            ))}
          </ol>
          <div id="calculadora" className="scroll-mt-28 lg:col-span-6">
            <Reveal>
              <QuantityCalculator />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
