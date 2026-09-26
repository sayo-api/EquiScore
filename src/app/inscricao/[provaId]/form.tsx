"use client";
import { useActionState, useEffect } from "react";
import { inscrever, type EstadoInsc } from "./actions";
import { IconCheck, IconSpinner } from "@/lib/icons";
import { somSucesso } from "@/lib/som";
import { CamposConjunto, campoCad, rotulo } from "@/components/campos-cadastro";
import { ALTURAS_SALTO } from "@/lib/postos";

export function FormInscricaoPublica({ provaId, tipo, reprises }: { provaId: string; tipo: string; reprises: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState<EstadoInsc, FormData>((s, f) => inscrever(provaId, s, f), undefined);
  useEffect(() => { if (estado?.ok) somSucesso(); }, [estado?.ok]);

  if (estado?.ok)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surf p-8 text-center shadow-sm eqs-pop">
        <span className="grid size-14 place-items-center rounded-full bg-okwash text-ok"><IconCheck width={30} height={30} /></span>
        <p className="text-lg font-black">Inscrição enviada!</p>
        <p className="text-sm text-mut">Aguarde a aprovação do organizador.</p>
      </div>
    );

  return (
    <form action={acao} className="flex flex-col gap-4 rounded-2xl border border-line bg-surf p-5 shadow-sm">
      {tipo === "ADESTRAMENTO" ? (
        <div>
          <label className={rotulo}>Reprise <span className="text-red">*</span></label>
          <select name="repriseId" required defaultValue="" className={campoCad}>
            <option value="" disabled>— escolha a reprise —</option>
            {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
      ) : (
        <div>
          <label className={rotulo}>Altura que vai disputar <span className="text-red">*</span></label>
          <select name="altura" defaultValue="" className={campoCad}>
            <option value="" disabled>— escolha a altura —</option>
            {ALTURAS_SALTO.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}

      <CamposConjunto categoria={tipo === "ADESTRAMENTO"} />

      {estado?.erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
      <button data-som="off" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
        {enviando && <IconSpinner width={18} height={18} />} {enviando ? "Enviando…" : "Enviar inscrição"}
      </button>
    </form>
  );
}
