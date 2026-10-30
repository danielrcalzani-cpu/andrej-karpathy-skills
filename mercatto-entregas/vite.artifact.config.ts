// Build da versão claude.ai: mesma interface, com src/api.ts trocado pelo backend que usa o banco da página.
import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const artifactApi = fileURLToPath(new URL('./src/artifact/api.ts', import.meta.url));

const swapApi: Plugin = {
  name: 'mercatto-artifact-api',
  enforce: 'pre',
  async resolveId(source, importer, options) {
    if (!importer || !/(^|\/)api\.ts$/.test(source) || importer === artifactApi) return null;
    const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
    if (resolved && resolved.id.endsWith('/src/api.ts')) return artifactApi;
    return null;
  },
};

export default defineConfig({
  plugins: [swapApi, react()],
  define: { 'import.meta.env.VITE_TARGET': JSON.stringify('artifact') },
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    sourcemap: false,
    cssCodeSplit: false,
    modulePreload: false,
    assetsInlineLimit: 100_000_000,
    rollupOptions: { input: 'artifact/index.html', output: { codeSplitting: false } as Record<string, unknown> },
  },
});
