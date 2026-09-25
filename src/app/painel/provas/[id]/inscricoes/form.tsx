"use client";
import { useRef, useState, useTransition } from "react";
import { adicionarInscricao } from "./actions";

export function FormInscricao({ provaId, tipo, reprises }: { provaId: string; tipo: string; reprises: { id: string; nome: string }[] }) {
  const [erro, setErro] = useState<string>();
  const [pend, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const campo = "rounded-lg border border-line bg-surf px-3 py-2 text-base outline-none focus:border-red";
  return (
    <form ref={ref} action={(fd) => start(async () => {
        const r = await adicionarInscricao(provaId, fd);
        setErro(r.erro);
        if (!r.erro) ref.current?.reset();
      })}
      className="flex h-fit flex-col gap-3 rounded-xl border border-line bg-surf p-5 shadow-sm">
      <h2 className="text-lg font-bold">Adicionar inscrição</h2>
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <input name="postoGraduacao" placeholder="Posto" className={campo} />
        <input name="nome" placeholder="Nome do cavaleiro" required className={campo} />
      </div>
      <input name="cavalo" placeholder="Cavalo" required className={campo} />
      {tipo === "ADESTRAMENTO" ? (
        <select name="repriseId" required className={campo} defaultValue="">
          <option value="" disabled>Selecione a reprise</option>
          {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
      ) : (
        <input name="categoria" placeholder="Altura / categoria (ex.: 1,00 m)" className={campo} />
      )}
      {erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6">{erro}</p>}
      <button disabled={pend} className="rounded-lg bg-red py-2.5 font-bold text-white transition hover:bg-red6 disabled:opacity-60">
        {pend ? "Adicionando…" : "Adicionar"}
      </button>
    </form>
  );
}
