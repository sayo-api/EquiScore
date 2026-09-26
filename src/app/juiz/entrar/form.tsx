"use client";
import { useActionState } from "react";
import { entrarJuiz, type EstadoLoginJuiz } from "../actions";

export function FormEntrarJuiz() {
  const [estado, acao, enviando] = useActionState<EstadoLoginJuiz, FormData>(entrarJuiz, undefined);
  const campo = "w-full rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none transition focus:border-red";
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input name="usuario" placeholder="Usuário" required autoFocus defaultValue={estado?.usuario} key={estado?.usuario} className={campo} autoComplete="username" />
      <input name="senha" type="password" placeholder="Senha" required className={campo} autoComplete="current-password" />
      {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
      <button data-som="off" disabled={enviando} className="rounded-lg bg-red py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar como juiz"}
      </button>
    </form>
  );
}
