"use client";
import { useActionState, useEffect } from "react";
import { inscrever, type EstadoInsc } from "./actions";
import { IconCheck } from "@/lib/icons";
import { somSucesso } from "@/lib/som";

export function FormInscricaoPublica({ provaId, tipo, reprises }: { provaId: string; tipo: string; reprises: { id: string; nome: string }[] }) {
  const [estado, acao, enviando] = useActionState<EstadoInsc, FormData>((s, f) => inscrever(provaId, s, f), undefined);
  const campo = "rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none focus:border-red";
  useEffect(() => { if (estado?.ok) somSucesso(); }, [estado?.ok]);
  if (estado?.ok)
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surf p-8 text-center shadow-sm">
        <span className="grid size-12 place-items-center rounded-full bg-okwash text-ok"><IconCheck width={26} height={26} /></span>
        <p className="font-bold">Inscrição enviada!</p>
        <p className="text-sm text-mut">Aguarde a aprovação do organizador.</p>
      </div>
    );
  return (
    <form action={acao} className="flex flex-col gap-3 rounded-xl border border-line bg-surf p-5 shadow-sm">
      <div className="grid grid-cols-[100px_1fr] gap-2">
        <input name="postoGraduacao" placeholder="Posto" className={campo} />
        <input name="nome" placeholder="Nome do cavaleiro" required className={campo} />
      </div>
      <input name="cavalo" placeholder="Cavalo" required className={campo} />
      {tipo === "ADESTRAMENTO" ? (
        <select name="repriseId" required defaultValue="" className={campo}>
          <option value="" disabled>Selecione a reprise</option>
          {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
        </select>
      ) : (
        <input name="categoria" placeholder="Altura / categoria" className={campo} />
      )}
      <div className="grid grid-cols-2 gap-2">
        <input name="email" type="email" placeholder="E-mail (opcional)" className={campo} />
        <input name="telefone" placeholder="Telefone (opcional)" className={campo} />
      </div>
      {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6">{estado.erro}</p>}
      <button disabled={enviando} className="rounded-lg bg-red py-3 font-bold text-white transition hover:bg-red6 disabled:opacity-60">{enviando ? "Enviando…" : "Enviar inscrição"}</button>
    </form>
  );
}
