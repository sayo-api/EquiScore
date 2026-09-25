"use client";
import { useActionState, useState } from "react";
import { criarProva, type EstadoNova } from "./actions";

type Rep = { id: string; nome: string };
type Bar = { id: string; nome: string; desc: string };

export function FormNovaProva({ reprises, baremos }: { reprises: Rep[]; baremos: Bar[] }) {
  const [tipo, setTipo] = useState<"ADESTRAMENTO" | "SALTO">("ADESTRAMENTO");
  const [estado, acao, enviando] = useActionState<EstadoNova, FormData>(criarProva, undefined);
  const campo = "rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none focus:border-red";
  return (
    <form action={acao} className="mt-6 flex flex-col gap-5">
      <input type="hidden" name="tipo" value={tipo} />
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-mut">Modalidade</span>
        <div className="grid grid-cols-2 gap-2">
          {(["ADESTRAMENTO", "SALTO"] as const).map((t) => (
            <button type="button" key={t} onClick={() => setTipo(t)}
              className={`rounded-lg border px-4 py-3 font-bold transition ${tipo === t ? "border-red bg-redwash text-red6" : "border-line bg-surf text-mut hover:border-dim"}`}>
              {t === "ADESTRAMENTO" ? "Adestramento" : "Salto"}
            </button>
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Nome da prova
        <input name="nome" required className={campo} placeholder="Ex.: 4ª Etapa interna" />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Local
          <input name="local" className={campo} /></label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Data
          <input name="data" type="date" className={campo} /></label>
      </div>

      {tipo === "ADESTRAMENTO" ? (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Número de juízes
            <input name="numJuizes" type="number" min={1} max={5} defaultValue={1} className={`${campo} w-24`} /></label>
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-semibold text-mut">Reprises da prova</legend>
            <div className="grid gap-1.5 rounded-lg border border-line bg-surf p-3 sm:grid-cols-2">
              {reprises.map((r) => (
                <label key={r.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="reprises" value={r.id} className="size-4 accent-[var(--color-red)]" /> {r.nome}
                </label>
              ))}
            </div>
          </fieldset>
        </>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Baremo
            <select name="baremo" className={campo} defaultValue="220.2.1.1">
              {baremos.map((b) => <option key={b.id} value={b.id}>{b.nome}</option>)}
            </select>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Tempo concedido (s)
              <input name="tempoConcedido" type="number" min={1} defaultValue={80} className={campo} /></label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Tempo ideal (s, opcional)
              <input name="tempoIdeal" type="number" min={1} className={campo} placeholder="95% do concedido" /></label>
          </div>
        </>
      )}

      {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6">{estado.erro}</p>}
      <button disabled={enviando} className="self-start rounded-lg bg-red px-6 py-3 font-bold text-white transition hover:bg-red6 disabled:opacity-60">
        {enviando ? "Criando…" : "Criar prova"}
      </button>
    </form>
  );
}
