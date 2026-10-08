import Logo from "./Logo";
import { InstagramIcon, WhatsAppIcon } from "./Icons";
import { families } from "@/data/collections";
import { nav, site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";

export default function Footer() {
  return (
    <footer className="bg-night text-paper/80">
      <div className="container-x grid gap-12 border-t border-white/10 py-16 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <Logo variant="light" className="h-20 w-auto" />
          <p className="mt-6 font-serif text-2xl italic text-copper-soft">{site.tagline}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed">Pisos, revestimentos de parede e teto em Manaus — AM.</p>
        </div>

        <nav aria-label="Produtos" className="md:col-span-3">
          <h2 className="eyebrow text-paper/50">Produtos</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {families.map((f) => (
              <li key={f.id}>
                <a href={`#produto-${f.id}`} className="link-line hover:text-paper">
                  {f.name}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Rodapé" className="md:col-span-2">
          <h2 className="eyebrow text-paper/50">Navegação</h2>
          <ul className="mt-5 space-y-3 text-sm">
            {nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="link-line hover:text-paper">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="md:col-span-3">
          <h2 className="eyebrow text-paper/50">Contato</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-paper">
                <WhatsAppIcon className="h-4 w-4 text-copper-soft" />
                {site.whatsapp.display}
              </a>
            </li>
            <li>
              <a href={`mailto:${site.email}`} className="link-line break-all hover:text-paper">
                {site.email}
              </a>
            </li>
            <li>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-paper">
                <InstagramIcon className="h-4 w-4 text-copper-soft" />
                {site.instagram.handle}
              </a>
            </li>
            <li>
              <address className="not-italic leading-relaxed">
                {site.address.street}
                <br />
                {site.address.district}
                <br />
                {site.address.city} — {site.address.state}
              </address>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-paper/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Mercatto Decor · Manaus — AM</p>
          <p>Imagens de ambientes ilustrativas. Cores aproximadas: solicite a amostra física na loja.</p>
        </div>
      </div>
    </footer>
  );
}
