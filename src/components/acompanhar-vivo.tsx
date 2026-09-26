"use client";
import { useEffect, useState } from "react";
import type { GrupoResultado } from "@/lib/domain/resultados";
import { IconTv, IconDown, IconLista, IconX, IconSpinner } from "@/lib/icons";

type EmPista = { conjunto: string; cavalo: string; reprise: string } | null;
type Detalhe = {
  conjunto: { nome: string; cavalo: string };
  reprise: { nome: string; movimentos: { num: number; descricao: string; coeficiente: number }[]; notasConjunto: { num: number; descricao: string; coeficiente: number }[] } | null;
  avaliacoes: { juizLetra: string; status: string; percentualFinal: number; notasPista: { num: number; nota: number | null; obs: string }[]; notasConjunto: { num: number; nota: number | null; obs: string }[] }[];
};

export function AcompanharVivo({ provaId }: { provaId: string }) {
  const [grupos, setGrupos] = useState<GrupoResultado[] | null>(null);
  const [emPista, setEmPista] = useState<EmPista>(null);
  const [erro, setErro] = useState(false);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<{ cav: string; letra: string } | null>(null);

  useEffect(() => {
    let vivo = true;
    const buscar = async () => {
      try {
        const r = await fetch(`/api/pub/${provaId}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (vivo) { setGrupos(d.grupos); setEmPista(d.emPista ?? null); setErro(false); }
      } catch { if (vivo) setErro(true); }
    };
    buscar();
    const t = setInterval(() => { if (!document.hidden) buscar(); }, 10000);
    const vis = () => { if (!document.hidden) buscar(); };
    document.addEventListener("visibilitychange", vis);
    return () => { vivo = false; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [provaId]);

  const toggle = (k: string) => setAbertos((s) => { const n = new Set(s); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  if (grupos === null) return <p className="p-8 text-center text-mut">{erro ? "Não foi possível carregar." : "Carregando…"}</p>;
  if (!grupos.length) return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-mut">Sem resultados ainda.</p>;

  return (
    <div className="flex flex-col gap-5">
      {emPista && (
        <div className="flex items-center gap-3 rounded-2xl border border-red bg-redwash p-4 shadow-sm eqs-pop">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red text-white"><IconTv width={20} height={20} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-red6">Em pista agora</div>
            <div className="truncate text-lg font-black leading-tight">{emPista.conjunto}</div>
            <div className="truncate text-sm text-mut">{emPista.cavalo}{emPista.reprise ? ` · ${emPista.reprise}` : ""}</div>
          </div>
        </div>
      )}

      {grupos.map((g) => (
        <section key={g.titulo}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <IconLista width={16} height={16} className="text-red" />
            <h2 className="text-sm font-black uppercase tracking-wide text-ink">{g.titulo}</h2>
          </div>
          <ul className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
            {g.linhas.map((l, i) => {
              const key = g.titulo + "|" + (l.id || i);
              const aberto = abertos.has(key);
              const temDetalhe = !!(g.juizes?.length && l.id);
              return (
                <li key={key} className="border-t border-line2 first:border-0">
                  <button onClick={() => temDetalhe && toggle(key)} disabled={!temDetalhe}
                    className={`flex w-full items-center gap-3 px-3 py-3 text-left transition ${temDetalhe ? "active:bg-surf2" : ""}`}>
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl font-mono text-sm font-black ${l.posicao ? "bg-red text-white" : "bg-surf2 text-mut"}`}>{l.posicao ? `${l.posicao}º` : "–"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold leading-tight">{l.conjunto}</span>
                      <span className="block truncate text-sm text-mut">{l.cavalo}</span>
                    </span>
                    <span className={`shrink-0 text-right font-mono text-base font-black tabular-nums ${l.eliminado ? "text-red" : ""}`}>{l.resumo}</span>
                    {temDetalhe && <IconDown width={18} height={18} className={`shrink-0 text-dim transition ${aberto ? "rotate-180" : ""}`} />}
                  </button>

                  {aberto && temDetalhe && (
                    <div className="space-y-2 bg-surf2/60 px-3 pb-3 pt-1 eqs-fade">
                      {(l.porJuiz || []).map((j) => (
                        <div key={j.letra} className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surf px-3 py-2.5">
                          <span className="flex items-center gap-2.5">
                            <span className="grid size-7 place-items-center rounded-lg bg-red text-xs font-black text-white">{j.letra}</span>
                            <span className="text-sm font-semibold text-mut">Juiz {j.letra}</span>
                          </span>
                          <span className="flex items-center gap-2.5">
                            {j.posicao != null && <span className="whitespace-nowrap rounded-full bg-redwash px-2 py-0.5 text-[11px] font-bold text-red6">{j.posicao}º no juiz</span>}
                            <span className="font-mono text-sm font-bold tabular-nums">{j.valor}</span>
                            <button onClick={() => l.id && setModal({ cav: l.id, letra: j.letra })} aria-label={`Ver notas do juiz ${j.letra}`}
                              className="grid size-8 place-items-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red active:scale-95"><IconLista width={15} height={15} /></button>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {modal && <ModalMovimentos provaId={provaId} cav={modal.cav} letra={modal.letra} onFechar={() => setModal(null)} />}
    </div>
  );
}

function ModalMovimentos({ provaId, cav, letra, onFechar }: { provaId: string; cav: string; letra: string; onFechar: () => void }) {
  const [d, setD] = useState<Detalhe | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const r = await fetch(`/api/pub/${provaId}/detalhe?cav=${cav}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (vivo) setD(j);
      } catch { if (vivo) setErro(true); }
    })();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", onKey);
    return () => { vivo = false; document.removeEventListener("keydown", onKey); };
  }, [provaId, cav, onFechar]);

  const aval = d?.avaliacoes.find((a) => a.juizLetra === letra);
  const notaMap = new Map<string, number | null>();
  (aval?.notasPista || []).forEach((n) => notaMap.set("m" + n.num, n.nota));
  (aval?.notasConjunto || []).forEach((n) => notaMap.set("c" + n.num, n.nota));
  const fmt = (v: number | null | undefined) => (v == null ? "—" : String(v).replace(".", ","));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 eqs-fade sm:items-center sm:p-4" onClick={onFechar}>
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-line bg-surf shadow-lg eqs-pop sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surf/95 px-4 py-3 backdrop-blur">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red6">Notas — Juiz {letra}</div>
            <div className="text-sm font-black">{d?.conjunto.nome || "…"}</div>
          </div>
          <button onClick={onFechar} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut hover:bg-surf2"><IconX width={18} height={18} /></button>
        </div>
        <div className="p-3">
          {erro ? <p className="p-6 text-center text-mut">Não foi possível carregar.</p>
            : !d ? <p className="flex items-center justify-center gap-2 p-6 text-mut"><IconSpinner width={16} height={16} /> Carregando…</p>
            : !aval ? <p className="p-6 text-center text-mut">Sem notas deste juiz ainda.</p>
            : (
              <>
                <h3 className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wider text-mut">Movimentos</h3>
                <ul className="overflow-hidden rounded-xl border border-line">
                  {(d.reprise?.movimentos || []).map((m) => (
                    <li key={"m" + m.num} className="flex items-start gap-2 border-t border-line2 px-3 py-2 first:border-0">
                      <span className="w-6 shrink-0 text-center font-mono text-sm font-bold text-mut">{m.num}</span>
                      <span className="min-w-0 flex-1 text-sm">{m.descricao}{m.coeficiente > 1 && <span className="ml-1 rounded bg-redwash px-1 text-[10px] font-bold text-red6">×{m.coeficiente}</span>}</span>
                      <span className="w-10 shrink-0 text-right font-mono text-base font-black tabular-nums">{fmt(notaMap.get("m" + m.num))}</span>
                    </li>
                  ))}
                </ul>
                {(d.reprise?.notasConjunto || []).length > 0 && (
                  <>
                    <h3 className="mb-1.5 mt-4 px-1 text-xs font-bold uppercase tracking-wider text-mut">Notas de conjunto</h3>
                    <ul className="overflow-hidden rounded-xl border border-line">
                      {(d.reprise?.notasConjunto || []).map((c) => (
                        <li key={"c" + c.num} className="flex items-start gap-2 border-t border-line2 px-3 py-2 first:border-0">
                          <span className="w-6 shrink-0 text-center font-mono text-sm font-bold text-mut">{c.num}</span>
                          <span className="min-w-0 flex-1 text-sm">{c.descricao}{c.coeficiente > 1 && <span className="ml-1 rounded bg-redwash px-1 text-[10px] font-bold text-red6">×{c.coeficiente}</span>}</span>
                          <span className="w-10 shrink-0 text-right font-mono text-base font-black tabular-nums">{fmt(notaMap.get("c" + c.num))}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </>
            )}
        </div>
      </div>
    </div>
  );
}
