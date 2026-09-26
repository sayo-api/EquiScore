"use client";
import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { IconPlus, IconLapis, IconLixeira, IconX, IconGavel } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";
import { criarJuiz, editarJuiz, excluirJuiz, type EstadoJuiz } from "./actions";

export type JuizLinha = { id: string; usuario: string; nome: string; letra: string };

const LETRAS = ["C", "B", "E", "H", "M"];
const campo = "w-full rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none transition focus:border-red";

export function GerenciarJuizes({ provaId, juizes, numJuizes }: { provaId: string; juizes: JuizLinha[]; numJuizes: number }) {
  const [editando, setEditando] = useState<JuizLinha | null>(null);
  const usadas = juizes.map((j) => j.letra);
  const sugestao = useMemo(() => LETRAS.slice(0, numJuizes).find((l) => !usadas.includes(l)) || LETRAS.find((l) => !usadas.includes(l)) || "", [usadas, numJuizes]);

  return (
    <div className="eqs-in">
      <div className="mb-5 rounded-xl border border-line bg-surf2 p-4 text-sm text-mut">
        <p className="flex items-center gap-2 font-semibold text-ink"><IconGavel width={16} height={16} className="text-red" /> Como funciona</p>
        <p className="mt-1">Crie um login para cada juiz. Cada juiz entra em <span className="font-mono text-ink">/juiz/entrar</span> com seu usuário e senha e lança as notas <b>apenas da sua letra</b>. A nota final é a média dos juízes com nota lançada.</p>
        <p className="mt-1">Esta prova está configurada para <b className="text-ink">{numJuizes}</b> juiz{numJuizes > 1 ? "es" : ""} ({LETRAS.slice(0, numJuizes).join(", ")}).</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
          {juizes.length === 0 ? (
            <p className="p-8 text-center text-mut">Nenhum juiz cadastrado. Crie o primeiro ao lado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mut">
                  <th className="px-4 py-3 font-bold">Letra</th>
                  <th className="px-4 py-3 font-bold">Login</th>
                  <th className="px-4 py-3 font-bold">Nome</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {juizes.map((j) => (
                  <tr key={j.id} className="border-t border-line2 transition hover:bg-surf2">
                    <td className="px-4 py-3"><span className="grid size-8 place-items-center rounded-lg bg-redwash font-black text-red6">{j.letra}</span></td>
                    <td className="px-4 py-3 font-mono font-bold">{j.usuario}</td>
                    <td className="px-4 py-3">{j.nome}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setEditando(j)} aria-label={`Editar ${j.usuario}`}
                        className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red active:scale-95">
                        <IconLapis width={15} height={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <FormNovo provaId={provaId} sugestao={sugestao} usadas={usadas} />
      </div>

      {editando && <ModalEditar provaId={provaId} juiz={editando} usadas={usadas} onFechar={() => setEditando(null)} />}
    </div>
  );
}

function FormNovo({ provaId, sugestao, usadas }: { provaId: string; sugestao: string; usadas: string[] }) {
  const [estado, acao, enviando] = useActionState<EstadoJuiz, FormData>((s, f) => criarJuiz(provaId, s, f), undefined);
  useEffect(() => { if (estado?.ok) somSucesso(); else if (estado?.erro) somAviso(); }, [estado]);
  return (
    <section className="h-fit rounded-2xl border border-line bg-surf p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-bold"><IconPlus width={18} height={18} className="text-red" /> Novo juiz</h2>
      <form action={acao} className="flex flex-col gap-3" key={estado?.ok}>
        <label className="text-sm font-semibold text-mut">Letra do juiz
          <select name="letra" defaultValue={sugestao} className={campo + " mt-1"}>
            {LETRAS.map((l) => <option key={l} value={l} disabled={usadas.includes(l)}>{l}{usadas.includes(l) ? " (em uso)" : ""}</option>)}
          </select>
        </label>
        <input name="usuario" placeholder="Login (ex.: juiz.c)" required className={campo} autoComplete="off" />
        <input name="nome" placeholder="Nome do juiz (opcional)" className={campo} autoComplete="off" />
        <input name="senha" type="text" placeholder="Senha" required className={campo} autoComplete="off" />
        {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
        {estado?.ok && <p className="rounded-lg bg-okwash px-3 py-2 text-sm font-semibold text-ok">{estado.ok}</p>}
        <button data-som="off" disabled={enviando} className="rounded-lg bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
          {enviando ? "Criando…" : "Criar juiz"}
        </button>
      </form>
    </section>
  );
}

function ModalEditar({ provaId, juiz, usadas, onFechar }: { provaId: string; juiz: JuizLinha; usadas: string[]; onFechar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoJuiz, FormData>((s, f) => editarJuiz(provaId, s, f), undefined);
  const [pend, start] = useTransition();
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => { if (estado?.ok) { somSucesso(); onFechar(); } else if (estado?.erro) somAviso(); }, [estado, onFechar]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFechar]);

  const remover = () => start(async () => { await excluirJuiz(provaId, juiz.id); onFechar(); });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 eqs-fade" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black">Editar <span className="font-mono">{juiz.usuario}</span></h2>
          <button onClick={onFechar} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut transition hover:bg-surf2 hover:text-ink active:scale-95"><IconX width={18} height={18} /></button>
        </div>
        <form action={acao} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={juiz.id} />
          <label className="text-sm font-semibold text-mut">Letra
            <select name="letra" defaultValue={juiz.letra} className={campo + " mt-1"}>
              {LETRAS.map((l) => <option key={l} value={l} disabled={l !== juiz.letra && usadas.includes(l)}>{l}</option>)}
            </select>
          </label>
          <label className="text-sm font-semibold text-mut">Nome
            <input name="nome" defaultValue={juiz.nome} className={campo + " mt-1"} />
          </label>
          <label className="text-sm font-semibold text-mut">Nova senha <span className="font-normal text-dim">(em branco = manter)</span>
            <input name="senha" type="text" placeholder="••••" className={campo + " mt-1"} autoComplete="off" />
          </label>
          {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
          <button data-som="off" disabled={enviando} className="rounded-lg bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
            {enviando ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>
        <div className="mt-5 border-t border-line pt-4">
          {!confirmar ? (
            <button onClick={() => setConfirmar(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-red transition hover:text-red6"><IconLixeira width={16} height={16} /> Excluir juiz</button>
          ) : (
            <div className="rounded-lg bg-redwash p-3 eqs-fade">
              <p className="text-sm font-semibold text-red6">Excluir o juiz <span className="font-mono">{juiz.usuario}</span>? As notas já lançadas por ele permanecem.</p>
              <div className="mt-3 flex gap-2">
                <button disabled={pend} onClick={remover} className="rounded-lg bg-red px-3 py-2 text-sm font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60">{pend ? "Excluindo…" : "Sim, excluir"}</button>
                <button disabled={pend} onClick={() => setConfirmar(false)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold transition hover:border-dim active:scale-95">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
