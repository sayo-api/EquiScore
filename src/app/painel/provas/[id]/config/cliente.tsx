"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { editarProva, alternarStatus, excluirProva, type EstadoConfig } from "./actions";
import { IconSalvar, IconSpinner, IconLixeira, IconCheck, IconX } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";

const campo = "w-full rounded-xl border border-line bg-surf px-3.5 py-2.5 text-base outline-none transition focus:border-red focus:ring-2 focus:ring-red/15";
const rotulo = "mb-1 block text-xs font-bold uppercase tracking-wide text-mut";

type Valores = { nome: string; local: string; data: string; numJuizes: number; baremo: string; tempoConcedido: number; tempoIdeal?: number };

export function ConfigProva({ provaId, tipo, status, valores, reprises, selecionadas, baremos }: {
  provaId: string; tipo: string; status: string; valores: Valores;
  reprises: { id: string; nome: string }[]; selecionadas: string[]; baremos: { id: string; nome: string }[];
}) {
  const [estado, acao, enviando] = useActionState<EstadoConfig, FormData>((s, f) => editarProva(provaId, s, f), undefined);
  const [pend, start] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const router = useRouter();

  useEffect(() => { if (estado?.ok) somSucesso(); else if (estado?.erro) somAviso(); }, [estado]);

  return (
    <div className="eqs-in max-w-2xl">
      <form action={acao} className="flex flex-col gap-4">
        <div><label className={rotulo}>Nome da prova</label><input name="nome" defaultValue={valores.nome} required className={campo} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={rotulo}>Local</label><input name="local" defaultValue={valores.local} className={campo} /></div>
          <div><label className={rotulo}>Data</label><input name="data" type="date" defaultValue={valores.data} className={campo} /></div>
        </div>

        {tipo === "ADESTRAMENTO" ? (
          <>
            <div><label className={rotulo}>Número de juízes</label>
              <input name="numJuizes" type="number" min={1} max={5} defaultValue={valores.numJuizes} className={campo + " w-28"} /></div>
            <fieldset>
              <legend className={rotulo}>Reprises da prova</legend>
              <div className="grid gap-1.5 rounded-xl border border-line bg-surf p-3 sm:grid-cols-2">
                {reprises.map((r) => (
                  <label key={r.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="reprises" value={r.id} defaultChecked={selecionadas.includes(r.id)} className="size-4 accent-[var(--color-red)]" /> {r.nome}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <div><label className={rotulo}>Baremo</label>
              <select name="baremo" defaultValue={valores.baremo} className={campo}>
                {baremos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
              </select></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={rotulo}>Tempo concedido (s)</label><input name="tempoConcedido" type="number" min={1} defaultValue={valores.tempoConcedido} className={campo} /></div>
              <div><label className={rotulo}>Tempo ideal (s)</label><input name="tempoIdeal" type="number" min={1} defaultValue={valores.tempoIdeal ?? ""} className={campo} placeholder="opcional" /></div>
            </div>
          </>
        )}

        {estado?.erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
        {estado?.ok && <p className="rounded-xl bg-okwash px-3 py-2 text-sm font-semibold text-ok">{estado.ok}</p>}
        <button data-som="off" disabled={enviando} className="inline-flex w-fit items-center gap-2 rounded-xl bg-red px-6 py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
          {enviando ? <IconSpinner width={18} height={18} /> : <IconSalvar width={18} height={18} />} {enviando ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>

      <div className="mt-8 rounded-2xl border border-line bg-surf2 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-mut">Situação da prova</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${status === "ATIVA" ? "bg-okwash text-ok" : "bg-surf text-mut"}`}>{status === "ATIVA" ? "Inscrições abertas" : "Encerrada"}</span>
          <button disabled={pend} onClick={() => start(async () => { await alternarStatus(provaId); router.refresh(); })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surf px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:border-red disabled:opacity-60">
            {pend ? <IconSpinner width={15} height={15} /> : status === "ATIVA" ? <IconX width={15} height={15} /> : <IconCheck width={15} height={15} />}
            {status === "ATIVA" ? "Encerrar inscrições" : "Reabrir inscrições"}
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-redln bg-redwash/40 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-red6">Zona de risco</h3>
        {!confirmar ? (
          <button onClick={() => setConfirmar(true)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red px-3.5 py-2 text-sm font-bold text-red transition hover:bg-red hover:text-white">
            <IconLixeira width={16} height={16} /> Excluir prova
          </button>
        ) : (
          <div className="mt-3 eqs-fade">
            <p className="text-sm font-semibold text-red6">Excluir esta prova e <b>todos</b> os dados dela (inscrições, notas, juízes, resultados e histórico)? Não há como desfazer.</p>
            <div className="mt-3 flex gap-2">
              <button data-som="off" disabled={pend} onClick={() => start(async () => { const r = await excluirProva(provaId); if (r?.erro) somAviso(); })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red px-3.5 py-2 text-sm font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60">
                {pend ? <IconSpinner width={15} height={15} /> : <IconLixeira width={15} height={15} />} {pend ? "Excluindo…" : "Sim, excluir tudo"}
              </button>
              <button disabled={pend} onClick={() => setConfirmar(false)} className="rounded-lg border border-line bg-surf px-3.5 py-2 text-sm font-semibold transition hover:border-dim">Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
