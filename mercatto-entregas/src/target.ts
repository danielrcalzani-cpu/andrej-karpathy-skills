/** true na versão publicada no claude.ai (sem servidor próprio); false na versão com servidor Node. */
export const IS_ARTIFACT = import.meta.env.VITE_TARGET === 'artifact';
