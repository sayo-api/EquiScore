"use client";
import { useSyncExternalStore } from "react";
import { assinarSom, definirSom, lerSomCliente, lerSomServidor, somClique } from "@/lib/som";
import { IconSom, IconMudo } from "@/lib/icons";

/** Alterna os efeitos sonoros do sistema (preferência salva no navegador). */
export function BotaoSom({ className = "" }: { className?: string }) {
  const ligado = useSyncExternalStore(assinarSom, lerSomCliente, lerSomServidor);
  const alternar = () => {
    const novo = !ligado;
    definirSom(novo);
    if (novo) somClique();
  };
  return (
    <button
      onClick={alternar}
      aria-pressed={ligado}
      aria-label={ligado ? "Desativar sons" : "Ativar sons"}
      title={ligado ? "Sons ativados" : "Sons desativados"}
      className={`grid size-9 place-items-center rounded-md border border-line text-mut transition hover:border-red hover:text-red ${className}`}
    >
      {ligado ? <IconSom width={18} height={18} /> : <IconMudo width={18} height={18} />}
    </button>
  );
}
