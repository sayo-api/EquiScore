"use client";
import { useActionState } from "react";
import { cadastrarComp, type EstadoComp } from "../actions";
import { PostoSelect, campoCad, rotulo } from "@/components/campos-cadastro";
import { IconSpinner } from "@/lib/icons";

export function FormCadastroComp() {
  const [estado, acao, enviando] = useActionState<EstadoComp, FormData>(cadastrarComp, undefined);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div><label className={rotulo}>Posto/Grad.</label><PostoSelect /></div>
        <div><label className={rotulo}>Nome <span className="text-red">*</span></label>
          <input name="nome" placeholder="Nome completo" required className={campoCad} autoComplete="name" /></div>
      </div>
      <div><label className={rotulo}>E-mail <span className="text-red">*</span></label>
        <input name="email" type="email" placeholder="voce@email.com" required className={campoCad} autoComplete="email" /></div>
      <div><label className={rotulo}>Telefone</label>
        <input name="telefone" type="tel" placeholder="opcional" className={campoCad} autoComplete="tel" /></div>
      <div><label className={rotulo}>Senha <span className="text-red">*</span></label>
        <input name="senha" type="password" placeholder="mínimo 6 caracteres" required className={campoCad} autoComplete="new-password" /></div>
      {estado?.erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
      <button data-som="off" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
        {enviando && <IconSpinner width={18} height={18} />} {enviando ? "Criando…" : "Criar conta"}
      </button>
    </form>
  );
}
