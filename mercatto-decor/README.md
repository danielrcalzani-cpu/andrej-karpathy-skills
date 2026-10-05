# Mercatto Decor — homepage

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

Defina `NEXT_PUBLIC_SITE_URL` (domínio definitivo) para canonical, Open Graph e JSON-LD.

## Conteúdo

Todo o conteúdo de produto vem dos catálogos Mercatto Decor (edição 2026) e fica em `src/data`:

- `products.ts` — os 45 padrões (código, linha, efeito, tom, medidas, "ideal para", textura, imagem de ambiente)
- `collections.ts` — as 5 linhas (piso colado, piso SPC, placas flexíveis, Château Mur, teto laminado)
- `catalogs.ts` — PDFs em `public/catalogos` e capas em `public/catalogs-covers`
- `site.ts` — contato, endereço, Instagram

Os componentes renderizam a partir desses arquivos: para incluir ou alterar um padrão, edite só os dados.

## Imagens

`public/textures` (amostras por padrão) e `public/projects` (ambientes, ilustrativos) foram extraídos dos PDFs por
`scripts/extract-assets.py`, com o mapeamento página a página documentado no próprio script.

## Pendências

- Domínio definitivo (`NEXT_PUBLIC_SITE_URL`).
- Fotos reais da loja/showroom e de obras executadas (hoje o site usa as imagens ilustrativas dos catálogos).
- Nomes comerciais do teto laminado (o catálogo ainda traz "Padrão 01–07").
- Número de seguidores do Instagram em `site.ts` é um retrato de out/2026.
