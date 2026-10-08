import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import DiscoveryControls from "./DiscoveryControls";
import { families, type FamilyId } from "@/data/collections";
import { productsByFamily } from "@/data/products";

const tabs: { id: FamilyId; label: string }[] = [
  { id: "placas", label: "Placas flexíveis" },
  { id: "chateau", label: "Château Mur" },
  { id: "piso-colado", label: "Piso colado" },
  { id: "piso-spc", label: "Piso SPC" },
  { id: "teto", label: "Teto laminado" },
];

/*
 * Abas em HTML + CSS (rádios + :has), para trocar de linha também onde JavaScript não
 * roda (ex.: pré-visualização de arquivos do iPhone). <DiscoveryControls> acrescenta as
 * setas e os links "Explorar coleção" (#colecoes-<linha>) onde há JavaScript.
 */
const rules = tabs
  .map(
    ({ id }) => `.disc:has(#disc-t-${id}:checked) [data-f="${id}"]{display:block}
.disc:has(#disc-t-${id}:checked) label[for="disc-t-${id}"]{color:var(--color-ink)}
.disc:has(#disc-t-${id}:checked) label[for="disc-t-${id}"] .disc-bar{transform:scaleX(1)}
.disc:has(#disc-t-${id}:focus-visible) label[for="disc-t-${id}"]{outline:2px solid var(--color-copper);outline-offset:2px}`,
  )
  .join("\n");

export default function ProductDiscovery() {
  return (
    <section id="colecoes" aria-labelledby="colecoes-title" className="disc scroll-mt-16 bg-paper py-16 md:py-36">
      <style>{`.disc-panel{display:none}\n${rules}`}</style>
      <div className="container-x">
        <SectionHeading
          id="colecoes-title"
          eyebrow="Coleções e padrões"
          title={
            <>
              Escolha pelo <em>padrão.</em>
            </>
          }
          intro="Todos os padrões dos catálogos, com código, efeito e medidas. Toque ou passe o cursor sobre a amostra para ver o padrão aplicado, quando houver imagem de ambiente."
        />

        <div className="mt-14 flex flex-col gap-6 border-b border-ink/15 md:flex-row md:items-end md:justify-between">
          <fieldset className="min-w-0">
            <legend className="sr-only">Linhas de produto</legend>
            {tabs.map((t, i) => (
              <input key={t.id} type="radio" name="disc-tab" id={`disc-t-${t.id}`} defaultChecked={i === 0} className="sr-only" />
            ))}
            <div className="no-scrollbar relative -mx-5 flex overflow-x-auto px-5 md:mx-0 md:px-0">
              {tabs.map((t) => (
                <label
                  key={t.id}
                  htmlFor={`disc-t-${t.id}`}
                  className="relative shrink-0 cursor-pointer whitespace-nowrap px-4 pb-4 pt-2 text-sm text-stone transition-colors first:pl-0 hover:text-ink"
                >
                  {t.label}
                  <span className="ml-1.5 text-xs text-copper-deep">{productsByFamily(t.id).length}</span>
                  <span
                    aria-hidden="true"
                    className="disc-bar absolute inset-x-0 bottom-[-1px] h-[2px] origin-left scale-x-0 bg-copper transition-transform duration-500"
                  />
                </label>
              ))}
            </div>
          </fieldset>
          <DiscoveryControls />
        </div>
      </div>

      {tabs.map((t) => {
        const family = families.find((f) => f.id === t.id)!;
        const items = productsByFamily(t.id);
        return (
          <div key={t.id} data-f={t.id} className="disc-panel" aria-label={`Padrões de ${family.name}`} role="region">
            <div className="container-x pt-8">
              <p className="max-w-2xl text-sm text-ink-soft">
                <span className="font-medium text-ink">{family.name}.</span>{" "}
                {family.specs.map((s) => `${s.label}: ${s.value}`).join(" · ")}
              </p>
            </div>

            <div className="relative mt-10">
              <ul
                aria-label={`Padrões de ${family.name}`}
                className="disc-track no-scrollbar relative flex snap-x snap-mandatory scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-4 md:scroll-px-10 md:gap-8 md:px-10 xl:scroll-px-[max(4rem,calc((100vw_-_88rem)/2_+_4rem))] xl:px-[max(4rem,calc((100vw_-_88rem)/2_+_4rem))]"
              >
                {items.map((p, i) => (
                  <li key={p.id} aria-label={`${i + 1} de ${items.length}`} className="w-[78%] shrink-0 snap-start sm:w-[46%] md:w-[31%] xl:w-[22%]">
                    <ProductCard product={p} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="container-x mt-8 flex items-center justify-between text-sm">
              <p className="text-stone md:hidden">Deslize para ver mais →</p>
              <a href={`#catalogo-${family.catalogId}`} className="link-line ml-auto pb-0.5 font-medium">
                Ver catálogo completo de {family.name}
              </a>
            </div>
          </div>
        );
      })}
    </section>
  );
}
