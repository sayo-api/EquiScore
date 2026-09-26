"use client";
import { useState, useTransition } from "react";
import { IconTv, IconSpinner, IconLixeira, IconX } from "@/lib/icons";
import { marcarEmPista, limparAvaliacoes } from "./actions";
import { somAviso } from "@/lib/som";

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


export function BotaoReset({ provaId, cavId, nome }: { provaId: string; cavId: string; nome: string }) {
  const [aberto, setAberto] = useState(false);
  const [pend, start] = useTransition();
  return (
    <>
      <button data-som="off" onClick={() => setAberto(true)} aria-label={`Limpar folha de ${nome}`}
        className="grid size-9 place-items-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red active:scale-95">
        <IconLixeira width={16} height={16} />
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 eqs-fade" onClick={() => setAberto(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Limpar folha</h2>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut hover:bg-surf2"><IconX width={18} height={18} /></button>
            </div>
            <p className="text-sm text-mut">Apagar <b className="text-ink">todas as notas</b> lançadas para <b className="text-ink">{nome}</b> (todos os juízes)? O conjunto volta para “Aguardando”. Não há como desfazer.</p>
            <div className="mt-5 flex gap-2">
              <button data-som="off" disabled={pend} onClick={() => start(async () => { const r = await limparAvaliacoes(provaId, cavId); if (r?.erro) somAviso(); else setAberto(false); })}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red py-2.5 font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60">
                {pend ? <IconSpinner width={16} height={16} /> : <IconLixeira width={16} height={16} />} {pend ? "Limpando…" : "Sim, limpar"}
              </button>
              <button disabled={pend} onClick={() => setAberto(false)} className="rounded-lg border border-line px-4 py-2.5 font-semibold transition hover:border-dim active:scale-95">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
