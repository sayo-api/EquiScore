"use client";
import { useRef, useState, useTransition } from "react";
import { adicionarInscricao } from "./actions";
import { CamposConjunto, campoCad, rotulo } from "@/components/campos-cadastro";
import { ALTURAS_SALTO } from "@/lib/postos";
import { IconPlus, IconSpinner } from "@/lib/icons";

export function FormInscricao({ provaId, tipo, reprises }: { provaId: string; tipo: string; reprises: { id: string; nome: string }[] }) {
  const [erro, setErro] = useState<string>();
  const [pend, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={(fd) => start(async () => {
        const r = await adicionarInscricao(provaId, fd);
        setErro(r.erro);
        if (!r.erro) ref.current?.reset();
      })}
      className="flex h-fit flex-col gap-4 rounded-2xl border border-line bg-surf p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-bold"><IconPlus width={18} height={18} className="text-red" /> Adicionar inscrição</h2>
      {tipo === "ADESTRAMENTO" ? (
        <div>
          <label className={rotulo}>Reprise <span className="text-red">*</span></label>
          <select name="repriseId" required className={campoCad} defaultValue="">
            <option value="" disabled>— selecione a reprise —</option>
            {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className={rotulo}>Altura</label>
          <select name="altura" className={campoCad} defaultValue="">
            <option value="" disabled>— selecione a altura —</option>
            {ALTURAS_SALTO.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
      <CamposConjunto categoria={tipo === "ADESTRAMENTO"} />
      {erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{erro}</p>}
      <button data-som="off" disabled={pend} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
        {pend ? <IconSpinner width={18} height={18} /> : <IconPlus width={18} height={18} />} {pend ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}
