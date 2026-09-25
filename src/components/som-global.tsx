"use client";
import { useEffect } from "react";
import { somClique } from "@/lib/som";

/**
 * Toca um clique sutil ao acionar qualquer elemento interativo (botão, link,
 * checkbox, aba, resumo). Marque `data-som="off"` para silenciar um elemento
 * que já dispara seu próprio efeito de sucesso. Respeita a preferência de mudo
 * (verificada dentro de somClique).
 */
const SELETOR = 'button, a, [role="button"], summary, input[type="checkbox"], input[type="radio"], label[data-som="on"]';

export function SomGlobal() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement | null)?.closest<HTMLElement>(SELETOR);
      if (!alvo) return;
      if (alvo.closest('[data-som="off"]')) return;
      if (alvo instanceof HTMLButtonElement && alvo.disabled) return;
      somClique();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
