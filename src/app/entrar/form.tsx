"use client";
import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";
export function FormEntrar() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrar, undefined);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Usuário
        <input name="usuario" autoComplete="username" defaultValue={estado?.usuario} required
          className="rounded-lg border border-line bg-surf px-3 py-2.5 text-base text-ink outline-none focus:border-red" />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Senha
        <input name="senha" type="password" autoComplete="current-password" required
          className="rounded-lg border border-line bg-surf px-3 py-2.5 text-base text-ink outline-none focus:border-red" />
      </label>
      {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6">{estado.erro}</p>}
      <button disabled={enviando} className="mt-1 rounded-lg bg-red py-3 font-bold text-white transition hover:bg-red6 disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
