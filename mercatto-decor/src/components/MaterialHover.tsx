"use client";

import { useEffect } from "react";

/** Melhoria opcional: em telas com mouse, passar o cursor sobre uma matéria a seleciona. */
export default function MaterialHover() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    const panels = document.querySelectorAll<HTMLElement>("#materiais .mat-panel");
    const handlers = [...panels].map((panel) => {
      const radio = panel.querySelector<HTMLInputElement>(".mat-radio");
      const onEnter = () => {
        if (radio) radio.checked = true;
      };
      panel.addEventListener("mouseenter", onEnter);
      return () => panel.removeEventListener("mouseenter", onEnter);
    });
    return () => handlers.forEach((off) => off());
  }, []);
  return null;
}
