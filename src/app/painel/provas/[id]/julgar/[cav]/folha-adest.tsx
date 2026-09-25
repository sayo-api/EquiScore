"use client";
import { useMemo, useState, useTransition } from "react";
import { apurarFolha, type Reprise } from "@/lib/domain/adestramento";
import { IconSalvar } from "@/lib/icons";
import { salvarAvaliacao } from "../actions";
import { somClique, somSucesso } from "@/lib/som";

type Mov = { num: number; local?: string; descricao: string; coeficiente: number };
type Conj = { num: number; descricao: string; coeficiente: number };
type Salva = { notasPista?: { num: number; nota: number }[]; notasConjunto?: { num: number; nota: number }[]; errosPercurso?: number };

export function FolhaAdestramento({ provaId, cavId, letras, reprise, salvas }: {
  provaId: string; cavId: string; letras: string[]; reprise: Reprise & { movimentos: Mov[]; notasConjunto: Conj[] }; salvas: Record<string, Salva>;
}) {
  const [letra, setLetra] = useState(letras[0]);
  const inicial = (l: string) => {
    const s = salvas[l];
    const map = new Map<string, number>();
    (s?.notasPista || []).forEach((n) => map.set("m" + n.num, n.nota));
    (s?.notasConjunto || []).forEach((n) => map.set("c" + n.num, n.nota));
    return { notas: map, erros: s?.errosPercurso ?? 0 };
  };
  const [estado, setEstado] = useState(() => inicial(letras[0]));
  const [msg, setMsg] = useState<string>();
  const [pend, start] = useTransition();

  const trocarLetra = (l: string) => { setLetra(l); setEstado(inicial(l)); setMsg(undefined); };
  const setNota = (chave: string, valor: string) => {
    const v = valor.replace(",", ".").trim();
    const map = new Map(estado.notas);
    if (v === "") map.delete(chave);
    else { const n = Number(v); if (n >= 0 && n <= 10 && Math.round(n * 2) === n * 2) map.set(chave, n); }
    setEstado({ ...estado, notas: map });
  };

  const res = useMemo(() => apurarFolha(reprise, {
    notasPista: reprise.movimentos.map((m) => ({ num: m.num, nota: estado.notas.get("m" + m.num) ?? null })),
    notasConjunto: reprise.notasConjunto.map((c) => ({ num: c.num, nota: estado.notas.get("c" + c.num) ?? null })),
    errosPercurso: estado.erros,
  }), [reprise, estado]);
  const lancadas = estado.notas.size;
  const total = reprise.movimentos.length + reprise.notasConjunto.length;

  const salvar = (finalizar: boolean) => start(async () => {
    await salvarAvaliacao(provaId, cavId, letra, {
      notasPista: reprise.movimentos.filter((m) => estado.notas.has("m" + m.num)).map((m) => ({ num: m.num, nota: estado.notas.get("m" + m.num)! })),
      notasConjunto: reprise.notasConjunto.filter((c) => estado.notas.has("c" + c.num)).map((c) => ({ num: c.num, nota: estado.notas.get("c" + c.num)! })),
      erros: estado.erros, finalizar,
    });
    (finalizar ? somSucesso : somClique)();
    setMsg(finalizar ? "Folha finalizada." : "Rascunho salvo.");
    setTimeout(() => setMsg(undefined), 2500);
  });

  const notaInput = (chave: string) => (
    <input value={estado.notas.get(chave) != null ? String(estado.notas.get(chave)).replace(".", ",") : ""} onChange={(e) => setNota(chave, e.target.value)}
      inputMode="decimal" placeholder="—" aria-label={"Nota " + chave}
      className="w-16 rounded-lg border border-line bg-surf px-1 py-2 text-center font-mono text-lg font-bold outline-none focus:border-red" />
  );

  return (
    <div>
      {letras.length > 1 && (
        <div className="mb-4 flex gap-1.5">
          {letras.map((l) => (
            <button key={l} onClick={() => trocarLetra(l)} className={`size-9 rounded-lg border font-bold ${l === letra ? "border-red bg-redwash text-red6" : "border-line hover:border-dim"}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border-l-[3px] border-red bg-surf px-4 py-3 shadow-sm">
        <div>
          <div className={`font-mono text-3xl font-bold tabular-nums ${res.eliminadoPorErros ? "text-red" : ""}`}>
            {res.eliminadoPorErros ? "ELIMINADO" : res.percentual.toFixed(3).replace(".", ",") + "%"}
          </div>
          <div className="text-sm text-mut">Juiz {letra} · percentual</div>
        </div>
        <div className="flex gap-5 text-sm text-mut">
          <span>Pontos<b className="block font-mono text-base text-ink">{res.pontuacaoLiquida}</b></span>
          <span>Máximo<b className="block font-mono text-base text-ink">{reprise.pontuacaoMaxima}</b></span>
          <span>Lançadas<b className="block font-mono text-base text-ink">{lancadas}/{total}</b></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-mut">Erros de percurso
          <button onClick={() => setEstado({ ...estado, erros: Math.max(0, estado.erros - 1) })} className="grid size-8 place-items-center rounded-md border border-line font-bold hover:border-red">−</button>
          <b className="w-4 text-center font-mono text-ink">{estado.erros}</b>
          <button onClick={() => setEstado({ ...estado, erros: Math.min(3, estado.erros + 1) })} className="grid size-8 place-items-center rounded-md border border-line font-bold hover:border-red">+</button>
        </div>
      </div>

      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-mut">Movimentos</h3>
      <div className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
        {reprise.movimentos.map((m) => (
          <div key={m.num} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-line2 px-4 py-2.5 first:border-0">
            <span className="text-center font-mono font-bold text-mut">{m.num}</span>
            <span><b className="text-sm font-medium">{m.descricao}</b>{m.coeficiente > 1 && <span className="ml-1.5 rounded bg-redwash px-1.5 py-0.5 align-[1px] text-[10px] font-bold text-red6">×{m.coeficiente}</span>}{m.local && <small className="block text-xs text-mut">{m.local}</small>}</span>
            {notaInput("m" + m.num)}
          </div>
        ))}
      </div>
      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-mut">Notas de conjunto</h3>
      <div className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
        {reprise.notasConjunto.map((c) => (
          <div key={c.num} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-line2 px-4 py-2.5 first:border-0">
            <span className="text-center font-mono font-bold text-mut">{c.num}</span>
            <span><b className="text-sm font-medium">{c.descricao}</b>{c.coeficiente > 1 && <span className="ml-1.5 rounded bg-redwash px-1.5 py-0.5 align-[1px] text-[10px] font-bold text-red6">×{c.coeficiente}</span>}</span>
            {notaInput("c" + c.num)}
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 mt-5 flex items-center gap-3 border-t border-line bg-bg/90 py-3 backdrop-blur">
        {msg && <span className="rounded-lg bg-okwash px-3 py-1.5 text-sm font-semibold text-ok">{msg}</span>}
        <button disabled={pend} onClick={() => salvar(false)} className="ml-auto rounded-lg border border-line px-4 py-2.5 text-sm font-semibold hover:border-red">Salvar rascunho</button>
        <button data-som="off" disabled={pend} onClick={() => salvar(true)} className="inline-flex items-center gap-2 rounded-lg bg-red px-5 py-2.5 font-bold text-white hover:bg-red6 disabled:opacity-60"><IconSalvar width={17} height={17} /> Finalizar folha</button>
      </div>
    </div>
  );
}
