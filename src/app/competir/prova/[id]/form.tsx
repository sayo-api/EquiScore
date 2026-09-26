"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { registrarNaProva } from "../../actions";
import { CamposConjunto, campoCad, rotulo, type CavaloSalvo } from "@/components/campos-cadastro";
import { ALTURAS_SALTO } from "@/lib/postos";
import { IconCheck, IconSpinner } from "@/lib/icons";
import { somSucesso } from "@/lib/som";

export function FormInscricaoComp({ provaId, tipo, reprises, perfil, cavalos }: {
  provaId: string; tipo: string; reprises: { id: string; nome: string }[];
  perfil: { nome: string; postoGraduacao: string; telefone: string; email: string };
  cavalos: CavaloSalvo[];
}) {
  const router = useRouter();
  const [erro, setErro] = useState<string>();
  const [ok, setOk] = useState(false);
  const [pend, start] = useTransition();

  if (ok)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-surf p-8 text-center shadow-sm eqs-pop">
        <span className="grid size-14 place-items-center rounded-full bg-okwash text-ok"><IconCheck width={30} height={30} /></span>
        <p className="text-lg font-black">Inscrição enviada!</p>
        <p className="text-sm text-mut">Aguarde a aprovação do organizador.</p>
        <button onClick={() => router.push("/competir")} className="mt-2 rounded-xl border border-line px-4 py-2 font-semibold transition hover:border-red">Voltar ao início</button>
      </div>
    );

  return (
    <form action={(fd) => start(async () => { const r = await registrarNaProva(provaId, fd); if (r.erro) setErro(r.erro); else { somSucesso(); setOk(true); router.refresh(); } })}
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surf p-5 shadow-sm">
      {tipo === "ADESTRAMENTO" ? (
        <div><label className={rotulo}>Reprise <span className="text-red">*</span></label>
          <select name="repriseId" required defaultValue="" className={campoCad}>
            <option value="" disabled>— escolha a reprise —</option>
            {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
          </select>
        </div>
      ) : (
        <div><label className={rotulo}>Altura <span className="text-red">*</span></label>
          <select name="altura" required defaultValue="" className={campoCad}>
            <option value="" disabled>— escolha a altura —</option>
            {ALTURAS_SALTO.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      )}
      <CamposConjunto categoria={tipo === "ADESTRAMENTO"} cavalos={cavalos} v={{ nome: perfil.nome, postoGraduacao: perfil.postoGraduacao, telefone: perfil.telefone, email: perfil.email }} />
      {erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{erro}</p>}
      <button data-som="off" disabled={pend} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
        {pend && <IconSpinner width={18} height={18} />} {pend ? "Enviando…" : "Confirmar inscrição"}
      </button>
    </form>
  );
}
