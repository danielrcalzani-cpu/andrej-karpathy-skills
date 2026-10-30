// Página inicial: abre a versão de computador (/pc/) ou de celular (/m/).
// Respeita a escolha feita manualmente neste aparelho; senão, detecta pelo tipo de aparelho.
import { preferredUI, uiPath } from './ui.ts';

window.location.replace(uiPath(preferredUI()) + window.location.hash);
