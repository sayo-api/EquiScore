"use client";
import { useTransition } from "react";
import { IconX, IconSpinner } from "@/lib/icons";
import { cancelarInscricao } from "./actions";

export function CancelarInscricao({ cavId }: { cavId: string }) {
  const [pend, start] = useTransition();
  return (
    <button data-som="off" disabled={pend} aria-label="Cancelar inscrição"
      onClick={() => { if (confirm("Cancelar esta inscrição?")) start(async () => { await cancelarInscricao(cavId); }); }}
      className="grid size-8 shrink-0 place-items-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red active:scale-95 disabled:opacity-60">
      {pend ? <IconSpinner width={15} height={15} /> : <IconX width={15} height={15} />}
    </button>
  );
}
