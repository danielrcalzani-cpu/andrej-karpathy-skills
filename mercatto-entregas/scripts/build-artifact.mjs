// Gera dist-artifact/agenda-entregas.html: uma página única (JS, CSS e fontes embutidos) no formato do claude.ai.
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'vite';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
await build({ configFile: path.join(root, 'vite.artifact.config.ts'), logLevel: 'warn' });

const out = path.join(root, 'dist-artifact');
const html = fs.readFileSync(path.join(out, 'artifact', 'index.html'), 'utf8');
const read = (href) => fs.readFileSync(path.join(out, href.replace(/^\//, '')), 'utf8');

const scripts = [...html.matchAll(/<script type="module" crossorigin src="([^"]+)"><\/script>/g)].map((m) => read(m[1]));
const styles = [...html.matchAll(/<link rel="stylesheet" crossorigin href="([^"]+)">/g)].map((m) => read(m[1]));
if (!scripts.length) throw new Error('Script principal não encontrado no build.');

const js = scripts.join('\n').replace(/<\/script/gi, '<\\/script');
const css = styles.join('\n').replace(/<\/style/gi, '<\\/style');
const page = [
  '<title>Mercatto Decor Entregas</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap">',
  `<style>${css}</style>`,
  '<div id="root"></div>',
  `<script type="module">${js}</script>`,
  '',
].join('\n');
const file = path.join(out, 'agenda-entregas.html');
fs.writeFileSync(file, page);
console.log(`Página gerada: ${path.relative(root, file)} (${(page.length / 1024).toFixed(0)} KB)`);
