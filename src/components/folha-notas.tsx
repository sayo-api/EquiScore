"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apurarFolha, type Reprise } from "@/lib/domain/adestramento";
import { IconSalvar, IconCheck, IconX, IconAlerta } from "@/lib/icons";
import { somClique, somSucesso, somAviso } from "@/lib/som";

type Mov = { num: number; local?: string; descricao: string; coeficiente: number; diretrizes?: string };
type Conj = { num: number; descricao: string; coeficiente: number; diretrizes?: string };
type NotaSalva = { num: number; nota: number; obs?: string };
export type PayloadNotas = { notasPista: NotaSalva[]; notasConjunto: NotaSalva[]; erros: number };

type Célula = { grupo: "m" | "c"; num: number };
const chave = (c: Célula) => c.grupo + c.num;

export function FolhaNotas({
  reprise, letra, inicial, cacheKey,
  onSalvarParcial, onFinalizar, aposFinalizar,
}: {
  reprise: Reprise & { movimentos: Mov[]; notasConjunto: Conj[] };
  letra: string;
  inicial: { notas: Record<string, number>; obs?: Record<string, string>; erros: number };
  cacheKey: string;
  onSalvarParcial?: (p: PayloadNotas) => Promise<void>;
  onFinalizar: (p: PayloadNotas) => Promise<void>;
  aposFinalizar?: () => void;
}) {
  const [notas, setNotas] = useState<Map<string, number>>(() => new Map(Object.entries(inicial.notas)));
  const [obs, setObs] = useState<Map<string, string>>(() => new Map(Object.entries(inicial.obs || {})));
  const [erros, setErros] = useState(inicial.erros);
  const [ativa, setAtiva] = useState<Célula | null>(null);
  const [meio, setMeio] = useState(false);
  const [estadoSalvar, setEstadoSalvar] = useState<"ocioso" | "salvando" | "salvo" | "offline">("ocioso");
  const [conferir, setConferir] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [mostrarDir, setMostrarDir] = useState(true);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { try { setMostrarDir(localStorage.getItem("eqs_dir") !== "0"); } catch { /* */ } }, []);
  const alternarDir = () => setMostrarDir((v) => { const n = !v; try { localStorage.setItem("eqs_dir", n ? "1" : "0"); } catch { /* */ } return n; });

  const celulas = useMemo<Célula[]>(() => [
    ...reprise.movimentos.map((m) => ({ grupo: "m" as const, num: m.num })),
    ...reprise.notasConjunto.map((c) => ({ grupo: "c" as const, num: c.num })),
  ], [reprise]);

  const comObs = (k: string, base: { num: number; nota: number }): NotaSalva => {
    const o = obs.get(k);
    return o ? { ...base, obs: o } : base;
  };
  const payload = useCallback((): PayloadNotas => ({
    notasPista: reprise.movimentos.filter((m) => notas.has("m" + m.num) || obs.has("m" + m.num)).map((m) => comObs("m" + m.num, { num: m.num, nota: notas.get("m" + m.num) ?? 0 })),
    notasConjunto: reprise.notasConjunto.filter((c) => notas.has("c" + c.num) || obs.has("c" + c.num)).map((c) => comObs("c" + c.num, { num: c.num, nota: notas.get("c" + c.num) ?? 0 })),
    erros,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [reprise, notas, obs, erros]);

  // ── Cache offline: recupera um rascunho local mais completo que o servidor ──
  useEffect(() => {
    try {
      const bruto = localStorage.getItem(cacheKey);
      if (!bruto) return;
      const salvo = JSON.parse(bruto) as { notas: Record<string, number>; obs?: Record<string, string>; erros: number };
      const local = Object.keys(salvo.notas || {}).length;
      if (local > Object.keys(inicial.notas).length) {
        // Carregamento único do rascunho local (evita perder notas sem rede);
        // feito em efeito de propósito, para não quebrar a hidratação.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNotas(new Map(Object.entries(salvo.notas)));
        setObs(new Map(Object.entries(salvo.obs || {})));
        setErros(salvo.erros || 0);
      }
    } catch { /* ignora */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const gravarCache = useCallback((m: Map<string, number>, e: number, ob: Map<string, string>) => {
    try { localStorage.setItem(cacheKey, JSON.stringify({ notas: Object.fromEntries(m), obs: Object.fromEntries(ob), erros: e, em: Date.now() })); } catch { /* ignora */ }
  }, [cacheKey]);

  // ── Autosave debounced ──────────────────────────────────────
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agendarSalvar = useCallback(() => {
    if (!onSalvarParcial) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setEstadoSalvar("salvando");
      try {
        await onSalvarParcial(payload());
        setEstadoSalvar(navigator.onLine ? "salvo" : "offline");
      } catch {
        setEstadoSalvar("offline");
      }
    }, 700);
  }, [onSalvarParcial, payload]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const aplicar = useCallback((mut: (m: Map<string, number>) => void, novosErros = erros) => {
    setNotas((prev) => {
      const m = new Map(prev);
      mut(m);
      gravarCache(m, novosErros, obs);
      return m;
    });
    setEstadoSalvar("ocioso");
    agendarSalvar();
  }, [agendarSalvar, gravarCache, erros, obs]);

  const definirObs = (k: string, texto: string) => {
    setObs((prev) => {
      const m = new Map(prev);
      if (texto) m.set(k, texto); else m.delete(k);
      gravarCache(notas, erros, m);
      return m;
    });
    setEstadoSalvar("ocioso");
    agendarSalvar();
  };

  const proxima = (atual: Célula) => {
    const i = celulas.findIndex((c) => c.grupo === atual.grupo && c.num === atual.num);
    setAtiva(celulas[i + 1] ?? null);
  };

  const definirValor = (valor: number | null) => {
    if (!ativa) return;
    const k = chave(ativa);
    aplicar((m) => { if (valor == null) m.delete(k); else m.set(k, valor); });
    somClique();
    if (valor != null) proxima(ativa);
  };

  const tocarNumero = (n: number) => {
    const valor = meio ? (n === 10 ? 10 : n + 0.5) : n;
    definirValor(valor);
  };

  const mudarErros = (d: number) => {
    const novo = Math.max(0, Math.min(3, erros + d));
    setErros(novo);
    aplicar((m) => m, novo); // reusa autosave/cache com os novos erros
    somClique();
  };

  const res = useMemo(() => apurarFolha(reprise, {
    notasPista: reprise.movimentos.map((m) => ({ num: m.num, nota: notas.get("m" + m.num) ?? null })),
    notasConjunto: reprise.notasConjunto.map((c) => ({ num: c.num, nota: notas.get("c" + c.num) ?? null })),
    errosPercurso: erros,
  }), [reprise, notas, erros]);

  const lancadas = notas.size;
  const total = celulas.length;
  const faltam = total - lancadas;

  const finalizar = async () => {
    if (timer.current) clearTimeout(timer.current);
    setFinalizando(true);
    try {
      await onFinalizar(payload());
      try { localStorage.removeItem(cacheKey); } catch { /* ignora */ }
      somSucesso();
      aposFinalizar?.();
    } catch {
      somAviso();
      setFinalizando(false);
      setConferir(false);
    }
  };

  const fmt = (v: number | undefined) => (v == null ? "" : String(v).replace(".", ","));
  const selecionar = (c: Célula) => { setAtiva(c); somClique(); };

  const linha = (c: Célula, descricao: string, coef: number, local?: string, diretrizes?: string) => {
    const sel = ativa != null && ativa.grupo === c.grupo && ativa.num === c.num;
    const v = notas.get(chave(c));
    return (
      <div key={chave(c)} className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 border-t border-line2 px-4 py-2.5 first:border-0 ${sel ? "bg-redwash" : ""}`}>
        <span className="text-center font-mono font-bold text-mut">{c.num}</span>
        <span><b className="text-sm font-medium">{descricao}</b>{coef > 1 && <span className="ml-1.5 rounded bg-redwash px-1.5 py-0.5 align-[1px] text-[10px] font-bold text-red6">×{coef}</span>}{obs.has(chave(c)) && <span title="Tem observação" className="ml-1.5 inline-block size-1.5 rounded-full bg-red align-middle" />}{local && <small className="block text-xs text-mut">{local}</small>}{mostrarDir && diretrizes && <small className="mt-0.5 block text-xs italic text-dim">{diretrizes}</small>}{obs.has(chave(c)) && <small className="block truncate text-xs italic text-red6">Obs.: {obs.get(chave(c))}</small>}</span>
        <button type="button" onClick={() => selecionar(c)}
          aria-label={`Nota do item ${c.num}`}
          className={`h-11 w-16 rounded-lg border text-center font-mono text-lg font-bold tabular-nums transition ${sel ? "border-red ring-2 ring-red/30" : v != null ? "border-line bg-surf" : "border-dashed border-line text-dim"}`}>
          {v != null ? fmt(v) : "—"}
        </button>
      </div>
    );
  };

  return (
    <div className="pb-40">
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
          <span>Lançadas<b className={`block font-mono text-base ${faltam === 0 ? "text-ok" : "text-ink"}`}>{lancadas}/{total}</b></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-mut">
          <span>Erros
            {erros > 0 && <b className="ml-1 text-red6">(−{erros === 1 ? 2 : 6}{erros >= 3 ? " · elimina" : ""})</b>}
          </span>
          <button type="button" onClick={() => mudarErros(-1)} className="grid size-8 place-items-center rounded-md border border-line font-bold hover:border-red">−</button>
          <b className="w-4 text-center font-mono text-ink">{erros}</b>
          <button type="button" onClick={() => mudarErros(1)} className="grid size-8 place-items-center rounded-md border border-line font-bold hover:border-red">+</button>
        </div>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-mut">Movimentos</h3>
        <button type="button" onClick={alternarDir} className="text-xs font-semibold text-mut transition hover:text-red">{mostrarDir ? "Ocultar diretrizes" : "Mostrar diretrizes"}</button>
      </div>
      <div className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
        {reprise.movimentos.map((m) => linha({ grupo: "m", num: m.num }, m.descricao, m.coeficiente, m.local, m.diretrizes))}
      </div>
      <h3 className="mb-2 mt-6 text-xs font-bold uppercase tracking-wider text-mut">Notas de conjunto</h3>
      <div className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
        {reprise.notasConjunto.map((c) => linha({ grupo: "c", num: c.num }, c.descricao, c.coeficiente, undefined, c.diretrizes))}
      </div>

      {/* Teclado fixo */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surf/95 shadow-[0_-4px_20px_rgba(0,0,0,.06)] backdrop-blur">
        <div className="mx-auto max-w-4xl px-3 py-2.5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-mut">
              {ativa ? <>Lançando item <b className="text-ink">{ativa.grupo === "m" ? "" : "conj. "}{ativa.num}</b></> : "Toque numa nota para lançar"}
            </span>
            <span className="flex items-center gap-2">
              {estadoSalvar === "salvando" && <span className="text-mut">salvando…</span>}
              {estadoSalvar === "salvo" && <span className="inline-flex items-center gap-1 text-ok"><IconCheck width={13} height={13} /> salvo</span>}
              {estadoSalvar === "offline" && <span className="inline-flex items-center gap-1 text-warn"><IconAlerta width={13} height={13} /> salvo no aparelho</span>}
            </span>
          </div>
          {ativa && (
            <input
              value={obs.get(chave(ativa)) ?? ""}
              onChange={(e) => definirObs(chave(ativa), e.target.value)}
              placeholder={`Observação do item ${ativa.num} (opcional)`}
              className="mb-2 w-full rounded-lg border border-line bg-surf px-3 py-2 text-sm outline-none focus:border-red"
            />
          )}
          <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-11">
            {Array.from({ length: 11 }, (_, n) => (
              <button key={n} type="button" disabled={!ativa} onClick={() => tocarNumero(n)}
                className="h-11 rounded-lg border border-line bg-surf font-mono text-lg font-bold transition hover:border-red hover:bg-redwash active:scale-95 disabled:opacity-40">
                {meio ? (n === 10 ? "10" : `${n},5`) : n}
              </button>
            ))}
            <button type="button" onClick={() => { setMeio((v) => !v); somClique(); }}
              className={`col-span-2 h-11 rounded-lg border font-bold transition active:scale-95 sm:col-span-1 ${meio ? "border-red bg-red text-white" : "border-line hover:border-red"}`}>,5</button>
            <button type="button" disabled={!ativa} onClick={() => definirValor(null)}
              className="col-span-2 h-11 rounded-lg border border-line font-semibold text-mut transition hover:border-red hover:text-red active:scale-95 disabled:opacity-40 sm:col-span-1">Limpar</button>
            <button type="button" onClick={() => setConferir(true)} disabled={finalizando}
              className="col-span-2 inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-red font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60 sm:col-span-1">
              <IconSalvar width={16} height={16} /> Finalizar
            </button>
          </div>
        </div>
      </div>

      {conferir && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 eqs-fade" onClick={() => setConferir(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-black">Finalizar folha</h2>
              <button onClick={() => setConferir(false)} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut hover:bg-surf2"><IconX width={18} height={18} /></button>
            </div>
            <p className="text-sm text-mut">Juiz {letra} · percentual final</p>
            <p className={`font-mono text-3xl font-bold ${res.eliminadoPorErros ? "text-red" : ""}`}>{res.eliminadoPorErros ? "ELIMINADO" : res.percentual.toFixed(3).replace(".", ",") + "%"}</p>
            {faltam > 0 && !res.eliminadoPorErros && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-warnwash px-3 py-2 text-sm font-semibold text-warn"><IconAlerta width={16} height={16} /> Faltam {faltam} nota{faltam > 1 ? "s" : ""}. Finalizar mesmo assim?</p>
            )}
            <div className="mt-5 flex gap-2">
              <button data-som="off" disabled={finalizando} onClick={finalizar} className="flex-1 rounded-lg bg-red py-2.5 font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60">{finalizando ? "Finalizando…" : "Confirmar"}</button>
              <button disabled={finalizando} onClick={() => setConferir(false)} className="rounded-lg border border-line px-4 py-2.5 font-semibold transition hover:border-dim active:scale-95">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
