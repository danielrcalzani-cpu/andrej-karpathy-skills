import { cacheLife } from "next/cache";
import { FaInstagram, FaWhatsapp } from "react-icons/fa6";
import { site } from "@/content/site";
import { whatsappLink } from "@/lib/whatsapp";
import { Wordmark } from "./Wordmark";

async function CurrentYear() {
  "use cache";
  cacheLife("days");
  return <>{new Date().getFullYear()}</>;
}

export function Footer() {
  const linkClass =
    "inline-flex items-center gap-2.5 py-1.5 text-ivory/85 transition-colors hover:text-ivory";

  return (
    <footer id="site-footer" className="on-dark bg-aubergine-deep text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3 md:items-start">
        <div>
          <Wordmark tone="light" />
          <p className="mt-5 text-sm leading-relaxed text-ivory/70">
            {site.brand}
            <br />
            {site.city}, {site.state} · {site.creci}
          </p>
        </div>

        <nav aria-label="Contato e redes" className="md:col-span-2 md:justify-self-end">
          <ul className="flex flex-col gap-1 text-sm sm:flex-row sm:gap-10">
            <li>
              <a href={whatsappLink("geral")} target="_blank" rel="noopener noreferrer" data-cta="footer-whatsapp" className={linkClass}>
                <FaWhatsapp aria-hidden="true" className="size-[1.1rem] text-gold-light" />
                WhatsApp {site.phoneDisplay}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
            <li>
              <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" data-cta="footer-instagram" className={linkClass}>
                <FaInstagram aria-hidden="true" className="size-[1.1rem] text-gold-light" />
                Instagram {site.instagramHandle}
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-ivory/10">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-ivory/60 sm:px-8">
          © <CurrentYear /> {site.brand}. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
