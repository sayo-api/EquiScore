"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export function FormEntrar() {
  const [estado, acao, enviando] = useActionState(entrar, undefined);
  return (
    <form action={acao} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-300">
        Usuário
        <input
          name="usuario"
          autoComplete="username"
          defaultValue={estado?.usuario}
          key={estado?.usuario}
          required
          className="rounded-lg border border-eqs-line bg-eqs-ink px-3 py-2.5 text-base text-white outline-none focus:border-eqs-red"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-neutral-300">
        Senha
        <input
          name="senha"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-eqs-line bg-eqs-ink px-3 py-2.5 text-base text-white outline-none focus:border-eqs-red"
        />
      </label>
      {estado?.erro && (
        <p role="alert" className="rounded-lg bg-eqs-red/15 px-3 py-2 text-sm text-red-300">
          {estado.erro}
        </p>
      )}
      <button
        disabled={enviando}
        className="mt-2 rounded-lg bg-eqs-red py-3 font-bold text-white transition hover:bg-eqs-red-600 disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
