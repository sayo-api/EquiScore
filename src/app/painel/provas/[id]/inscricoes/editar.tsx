"use client";
import { useEffect, useState, useTransition } from "react";
import { IconLapis, IconX, IconSpinner } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";
import { CamposConjunto, campoCad, rotulo } from "@/components/campos-cadastro";
import { editarInscricao } from "./actions";

export type Inscrito = {
  id: string; nome: string; posto: string; cavalo: string; repriseId: string; categoria: string;
  cavaloFiliacao: string; cavaloPai: string; cavaloMae: string; tratador: string; equipe: string; email: string; telefone: string;
};

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
    const g = (k: string) => String(form.get(k) || "");
    const r = await editarInscricao(provaId, inscrito.id, {
      nome: g("nome"), postoGraduacao: g("postoGraduacao"), cavalo: g("cavalo"),
      repriseId: g("repriseId"), categoria: g("categoria"),
      cavaloFiliacao: g("cavaloFiliacao"), cavaloPai: g("cavaloPai"), cavaloMae: g("cavaloMae"),
      tratador: g("tratador"), equipe: g("equipe"), email: g("email"), telefone: g("telefone"),
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
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/40 p-4 eqs-fade" onClick={() => setAberto(false)}>
          <div className="my-8 w-full max-w-md rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Editar inscrição</h2>
              <button onClick={() => setAberto(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut hover:bg-surf2"><IconX width={18} height={18} /></button>
            </div>
            <form action={salvar} className="flex flex-col gap-4">
              {tipo === "ADESTRAMENTO" ? (
                <div><label className={rotulo}>Reprise</label>
                  <select name="repriseId" defaultValue={inscrito.repriseId} className={campoCad}>
                    {reprises.map((r) => <option key={r.id} value={r.id}>{r.nome}</option>)}
                  </select>
                </div>
              ) : (
                <div><label className={rotulo}>Altura / categoria</label>
                  <input name="categoria" defaultValue={inscrito.categoria} className={campoCad} />
                </div>
              )}
              <CamposConjunto categoria={tipo === "ADESTRAMENTO"} v={{
                postoGraduacao: inscrito.posto, categoria: inscrito.categoria, nome: inscrito.nome, cavalo: inscrito.cavalo,
                cavaloFiliacao: inscrito.cavaloFiliacao, cavaloPai: inscrito.cavaloPai, cavaloMae: inscrito.cavaloMae,
                tratador: inscrito.tratador, equipe: inscrito.equipe, email: inscrito.email, telefone: inscrito.telefone,
              }} />
              {erro && <p role="alert" className="rounded-xl bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{erro}</p>}
              <button data-som="off" disabled={pend} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99] disabled:opacity-60">
                {pend && <IconSpinner width={18} height={18} />} {pend ? "Salvando…" : "Salvar"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
