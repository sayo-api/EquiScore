"use client";
import { useActionState, useEffect } from "react";
import { atualizarPerfil, type EstadoComp } from "../actions";
import { PostoSelect, campoCad, rotulo } from "@/components/campos-cadastro";
import { IconSpinner } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";

export function FormPerfil({ valores }: { valores: { nome: string; nomeGuerra: string; postoGraduacao: string; telefone: string } }) {
  const [estado, acao, enviando] = useActionState<EstadoComp, FormData>(atualizarPerfil, undefined);
  useEffect(() => { if (estado?.ok) somSucesso(); else if (estado?.erro) somAviso(); }, [estado]);
  return (
    <form action={acao} className="flex flex-col gap-4 rounded-2xl border border-line bg-surf p-5 shadow-sm">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div><label className={rotulo}>Posto/Grad.</label><PostoSelect valor={valores.postoGraduacao} /></div>
        <div><label className={rotulo}>Nome completo <span className="text-red">*</span></label><input name="nome" defaultValue={valores.nome} required className={campoCad} /></div>
      </div>
      <div><label className={rotulo}>Nome de guerra <span className="text-red">*</span></label>
        <input name="nomeGuerra" defaultValue={valores.nomeGuerra} required className={campoCad} />
        <small className="mt-1 block text-xs text-dim">É o que aparece nas provas.</small></div>
      <div><label className={rotulo}>Telefone</label><input name="telefone" type="tel" defaultValue={valores.telefone} className={campoCad} /></div>
      <div><label className={rotulo}>Nova senha <span className="font-normal normal-case text-dim">(deixe em branco para manter)</span></label>
        <input name="senha" type="password" placeholder="••••••" className={campoCad} autoComplete="new-password" /></div>
      {estado?.erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
      {estado?.ok && <p className="rounded-xl bg-okwash px-3 py-2 text-sm font-semibold text-ok">{estado.ok}</p>}
      <button data-som="off" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
        {enviando && <IconSpinner width={18} height={18} />} {enviando ? "Salvando…" : "Salvar perfil"}
      </button>
    </form>
  );
}
