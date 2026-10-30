import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': `http://localhost:${process.env.PORT ?? 3000}` },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Três páginas: escolha automática (/), versão computador (/pc/) e versão celular (/m/).
    rollupOptions: { input: { index: 'index.html', pc: 'pc/index.html', m: 'm/index.html' } },
  },
});
