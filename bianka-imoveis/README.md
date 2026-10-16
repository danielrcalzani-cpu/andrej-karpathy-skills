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

## Where to edit things

| What | File |
| --- | --- |
| Name, CRECI, phone/WhatsApp, Instagram, years of experience, all page copy, SEO text | `src/content/site.ts` |
| Pre-filled WhatsApp messages per intent | `src/lib/whatsapp.ts` |
| Sold-property portfolio (photos, videos, demo switch) | `src/content/portfolio.ts` |
| Colors and fonts | `src/app/globals.css` (`@theme`) and `src/app/layout.tsx` |

`EXPERIENCE_YEARS` at the top of `site.ts` feeds every place that mentions the 22 years.

## Adding Bianka's portrait

1. Save a vertical photo (about 1200×1500 px, 4:5) as `public/bianka/retrato.jpg`.
2. In `src/content/site.ts`, set `portrait.src = "/bianka/retrato.jpg"` and update `width`/`height` to the real pixel size.

The monogram placeholder disappears automatically. The large hero illustration can be swapped for a photo the same way via `heroImage`.

## Adding sold properties (photos and videos)

1. Create a folder per property, e.g. `public/portfolio/casa-ponta-negra/`, and put the photos there (JPG/WebP, ~1600 px on the long side). Next.js optimizes and lazy-loads them.
2. Copy the commented example in `src/content/portfolio.ts` and fill it in:
   - `photos`: one or more `{ src, alt, width, height }` (real pixel sizes; vertical and horizontal both work).
   - `neighborhood`, `propertyType`, `description`, `specs`: optional — only use confirmed information; no prices or full addresses.
   - `video` (optional, one per property):
     - Local MP4: `{ type: "file", src: "/portfolio/.../tour.mp4", poster: "/portfolio/.../capa.jpg", width, height }`. Keep files small (H.264, 720p, a few MB). Videos never autoplay and use `preload="none"`, so nothing downloads until the visitor presses play.
     - YouTube: `{ type: "youtube", id: "VIDEO_ID", poster, width, height }`
     - Vimeo: `{ type: "vimeo", id: "123456789", poster, width, height }`
     Embeds load only after the visitor clicks the poster.
3. Real entries get the **Vendido** label. Items with `isDemo: true` are labelled **Demonstração** instead and never shown as sold.

### Before launch

- Set `SHOW_DEMO_PORTFOLIO = false` in `src/content/portfolio.ts` (and delete the demo entries and `public/portfolio/demo/` when you no longer need them).
- If there are no real entries yet, the "Imóveis vendidos" section and its menu link are hidden automatically.

## Analytics (later)

No tracking is installed. Every call-to-action carries `data-cta="…"` (e.g. `hero-comprar`, `servico-avaliacao`, `mobile-whatsapp`) and WhatsApp links also carry `data-intent`, so a tag manager can track clicks without changing components.
