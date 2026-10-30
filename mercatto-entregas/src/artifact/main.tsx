// Entrada da versão publicada no claude.ai. O link escolhe a versão: ...#pc (computador) ou ...#celular.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles.css';
import { App } from '../App.tsx';
import { applyUI, preferredUI } from '../ui.ts';

function versionFromLink() {
  const h = window.location.hash.replace('#', '');
  if (h === 'celular') return 'mobile' as const;
  if (h === 'pc') return 'pc' as const;
  return null;
}

applyUI(versionFromLink() ?? preferredUI());
window.addEventListener('hashchange', () => {
  const v = versionFromLink();
  if (v && !document.documentElement.classList.contains(v === 'mobile' ? 'ui-mobile' : 'ui-pc')) {
    applyUI(v);
    window.dispatchEvent(new Event('mercatto:ui'));
  }
});
document.documentElement.lang = 'pt-BR';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
