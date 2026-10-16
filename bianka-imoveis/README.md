# Bianka Rodrigues Imóveis — landing page

Single-page site for Bianka Rodrigues, real estate agent in Manaus (AM).
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · `react-icons` (Lucide + Font Awesome brand icons).
No database, CMS, login, or tracking scripts.

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build && npm start
```

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://yourdomain.com.br`) in production so canonical URLs, Open Graph and structured data point to the real domain.

## Page structure

1. **Bianka** — name, portrait, 22 years, personal approach (hero + "Sobre").
2. **Imóveis à venda e para alugar com Bianka** — her current properties, with "À venda" / "Para alugar" labels, a filter, photos, video tours and a "Tenho interesse neste imóvel" WhatsApp button per property. The prefilled message names the property, its status, neighborhood (if set) and its code (`id`).
3. **Imóveis vendidos** — a smaller credibility section.
4. Services, how it works, contact.

## Where to edit things

| What | File |
| --- | --- |
| Name, CRECI, phone/WhatsApp, Instagram, years of experience, all page copy, SEO text | `src/content/site.ts` |
| Pre-filled WhatsApp messages (general + per-property template) | `src/lib/whatsapp.ts` |
| Properties for sale, for rent and sold (photos, videos, demo switch) | `src/content/properties.ts` |
| Colors and fonts | `src/app/globals.css` (`@theme`) and `src/app/layout.tsx` |

`EXPERIENCE_YEARS` at the top of `site.ts` feeds every place that mentions the 22 years.

## Adding Bianka's portrait

The portrait is the first thing visitors see, so this is the most important placeholder to replace.

1. Save a vertical photo (about 1200×1500 px, 4:5, face in the upper half) as `public/bianka/retrato.jpg`.
2. In `src/content/site.ts`, set `portrait.src = "/bianka/retrato.jpg"` and update `width`/`height` to the real pixel size.

The "BR" monogram placeholder disappears automatically.

## Adding properties (photos and video tours)

1. Create a folder per property, e.g. `public/imoveis/casa-ponta-negra/`, and put the photos there (JPG/WebP, ~1600 px on the long side). Next.js optimizes and lazy-loads them.
2. Copy the commented example in `src/content/properties.ts` and fill it in:
   - `id`: a short unique code — it goes into the WhatsApp message so Bianka knows which property the visitor means.
   - `status`: `"venda"`, `"aluguel"` or `"vendido"`. Changing a sold property to `"vendido"` moves it to the sold section automatically.
   - `photos`: one or more `{ src, alt, width, height }` (real pixel sizes; vertical and horizontal both work).
   - `propertyType`, `neighborhood`, `price`, `description`, `specs`: optional. Only use confirmed information. Empty fields show as "Tipo a confirmar", "Bairro a confirmar" and "Valor sob consulta". No full addresses.
   - `video` (optional video tour):
     - Local MP4: `{ type: "file", src: "/imoveis/.../tour.mp4", poster: "/imoveis/.../capa.jpg", width, height }`. Keep files small (H.264, 720p, a few MB). Videos never autoplay and use `preload="none"`, so nothing downloads until the visitor presses play.
     - YouTube: `{ type: "youtube", id: "VIDEO_ID", poster, width, height }`
     - Vimeo: `{ type: "vimeo", id: "123456789", poster, width, height }`
     Embeds load only after the visitor clicks the poster.
3. Items with `isDemo: true` always carry a **Demonstração** label next to their status.

### Before launch

- Set `SHOW_DEMO_PROPERTIES = false` in `src/content/properties.ts` (and delete the demo entries and `public/portfolio/demo/` when you no longer need them).
- With no real available properties, the listings section shows "Novos imóveis em breve" with a WhatsApp button. With no real sold properties, the sold section is hidden.

## Standalone HTML version (`html/`)

`html/index.html` is the same landing page as plain HTML, CSS and a little JavaScript — no build step, no Node.js. Upload the whole `html/` folder (the page plus `assets/`) to any static host (Hostinger, Netlify, GitHub Pages, cPanel…) and it works.

Everything editable is in the `CONFIGURAÇÃO` block near the end of `index.html`:

- `YEARS_OF_EXPERIENCE`, `WHATSAPP_NUMBER`, `WHATSAPP_MESSAGES`
- `SHOW_DEMO_PROPERTIES` — set to `false` before launch
- `PROPERTIES` — one entry per property with `status: "venda" | "aluguel" | "vendido"` (commented example included); put the files in `html/assets/imoveis/<property>/`

Portrait: replace the marked placeholder block in the hero (comments show the exact `<img>` to paste). Replace `SEU-DOMINIO` in the `<head>` with the real domain so link previews (WhatsApp, Instagram, Facebook) show the `assets/og-image.png` card.

The HTML and the Next.js app are separate copies of the same content: if you keep both, update both, or pick one to publish.

## Analytics (later)

No tracking is installed. Every call-to-action carries `data-cta="…"` (e.g. `hero-whatsapp`, `interesse-<property id>`, `servico-avaliacao`, `mobile-whatsapp`) and WhatsApp links also carry `data-intent`, so a tag manager can track clicks without changing components.
