"use client";
import { useEffect, useState, useTransition } from "react";
import { IconLapis, IconX } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";
import { editarInscricao } from "./actions";

export type Inscrito = { id: string; nome: string; posto: string; cavalo: string; repriseId: string; categoria: string };

const campo = "w-full rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none transition focus:border-red";

export function EditarInscricao({ provaId, tipo, inscrito, reprises }: {
  provaId: string; tipo: string; inscrito: Inscrito; reprises: { id: string; nome: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState<string>();
  const [pend, start] = useTransition();

  useEffect(() => {
    if (!aberto) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setAberto(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aberto]);

  const salvar = (form: FormData) => start(async () => {
    const r = await editarInscricao(provaId, inscrito.id, {
      nome: String(form.get("nome") || ""),
      postoGraduacao: String(form.get("postoGraduacao") || ""),
      cavalo: String(form.get("cavalo") || ""),
      repriseId: String(form.get("repriseId") || ""),
      categoria: String(form.get("categoria") || ""),
    });
    if (r.erro) { setErro(r.erro); somAviso(); } else { somSucesso(); setAberto(false); }
  });

  return (
    <>
      <button onClick={() => { setErro(undefined); setAberto(true); }} aria-label={`Editar ${inscrito.nome}`}
        className="inline-flex items-center rounded-md border border-line p-1.5 text-mut transition hover:border-red hover:text-red active:scale-95">
        <IconLapis width={16} height={16} />
      </button>
      {aberto && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 eqs-fade" onClick={() => setAberto(false)}>
          <div className="w-full max-w-md rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Editar inscrição</h2>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut hover:bg-surf2"><IconX width={18} height={18} /></button>
            </div>
            <form action={salvar} className="flex flex-col gap-3">
              <div className="grid grid-cols-[110px_1fr] gap-2">
                <input name="postoGraduacao" defaultValue={inscrito.posto} placeholder="Posto" className={campo} />
                <input name="nome" defaultValue={inscrito.nome} placeholder="Nome" required className={campo} />
              </div>
              <input name="cavalo" defaultValue={inscrito.cavalo} placeholder="Cavalo" required className={campo} />
              {tipo === "ADESTRAMENTO" ? (
                <label className="text-sm font-semibold text-mut">Reprise
                  <select name="repriseId" defaultValue={inscrito.repriseId} className={campo + " mt-1"}>
                    {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </label>
              ) : (
                <input name="categoria" defaultValue={inscrito.categoria} placeholder="Altura / categoria" className={campo} />
              )}
              {erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{erro}</p>}
              <button data-som="off" disabled={pend} className="rounded-lg bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">{pend ? "Salvando…" : "Salvar"}</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
