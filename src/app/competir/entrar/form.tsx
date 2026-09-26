"use client";
import { useActionState } from "react";
import { entrarComp, type EstadoComp } from "../actions";
import { IconSpinner } from "@/lib/icons";

const campo = "w-full rounded-xl border border-line bg-surf px-3.5 py-2.5 text-base outline-none transition focus:border-red focus:ring-2 focus:ring-red/15";

export function FormEntrarComp() {
  const [estado, acao, enviando] = useActionState<EstadoComp, FormData>(entrarComp, undefined);
  return (
    <form action={acao} className="flex flex-col gap-3">
      <input name="email" type="email" placeholder="E-mail" required autoFocus className={campo} autoComplete="email" />
      <input name="senha" type="password" placeholder="Senha" required className={campo} autoComplete="current-password" />
      {estado?.erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
      <button data-som="off" disabled={enviando} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-3 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
        {enviando && <IconSpinner width={18} height={18} />} {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
