export type UIVersion = 'pc' | 'mobile';

const KEY = 'mercatto:versao';

/** Versão desta página, definida pela classe no <html> de /pc/ e /m/. */
export const UI: UIVersion = document.documentElement.classList.contains('ui-mobile') ? 'mobile' : 'pc';

export const uiPath = (v: UIVersion) => (v === 'mobile' ? '/m/' : '/pc/');

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
  window.location.href = uiPath(v) + window.location.hash;
}
