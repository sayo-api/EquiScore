"use client";
import { useTransition } from "react";
import { IconTv, IconSpinner } from "@/lib/icons";
import { marcarEmPista } from "./actions";

export function BotaoPista({ provaId, cavId, atual }: { provaId: string; cavId: string; atual: boolean }) {
  const [pend, start] = useTransition();
  return (
    <button
      data-som="off"
      disabled={pend}
      onClick={() => start(async () => { await marcarEmPista(provaId, atual ? null : cavId); })}
      className={`inline-flex min-w-[92px] items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-70 ${atual ? "border-red bg-red text-white" : "border-line text-mut hover:border-red hover:text-red"}`}
    >
      {pend ? <IconSpinner width={14} height={14} /> : <IconTv width={14} height={14} />}
      {pend ? "..." : atual ? "Na pista" : "Em pista"}
    </button>
  );
}
