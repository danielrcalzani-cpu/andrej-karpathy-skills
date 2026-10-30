import { IS_ARTIFACT } from './target.ts';

export type UIVersion = 'pc' | 'mobile';

const KEY = 'mercatto:versao';

/** Versão em uso nesta página (classe no <html>). */
export function currentUI(): UIVersion {
  return document.documentElement.classList.contains('ui-mobile') ? 'mobile' : 'pc';
}

export const uiPath = (v: UIVersion) => (v === 'mobile' ? '/m/' : '/pc/');
/** Nome usado no link da versão claude.ai: ...#pc ou ...#celular */
export const uiHash = (v: UIVersion) => (v === 'mobile' ? 'celular' : 'pc');

export function applyUI(v: UIVersion) {
  const el = document.documentElement;
  el.classList.remove('ui-pc', 'ui-mobile');
  el.classList.add(v === 'mobile' ? 'ui-mobile' : 'ui-pc');
}

export function preferredUI(): UIVersion {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'pc' || saved === 'mobile') return saved;
  } catch {
    /* sem armazenamento: só detecta */
  }
  const ua = navigator.userAgent;
  const phone = /Android|iPhone|iPod|Mobile|Windows Phone/i.test(ua);
  const tablet = /iPad|Tablet/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua));
  if (phone || tablet) return 'mobile';
  return window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1024 ? 'mobile' : 'pc';
}

/** Troca de versão e lembra a escolha neste aparelho. */
export function switchUI(v: UIVersion) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* ignore */
  }
  if (IS_ARTIFACT) {
    // Página única no claude.ai: troca o layout na hora, sem recarregar.
    applyUI(v);
    try {
      window.location.hash = uiHash(v);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event('mercatto:ui'));
    return;
  }
  window.location.href = uiPath(v) + window.location.hash;
}
