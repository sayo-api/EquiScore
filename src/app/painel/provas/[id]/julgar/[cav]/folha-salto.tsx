"use client";
import { useMemo, useState, useTransition } from "react";
import { calcularPercurso, baremoPorId } from "@/lib/domain/salto";
import { IconSalvar } from "@/lib/icons";
import { salvarSalto } from "../actions";
import { somClique, somSucesso } from "@/lib/som";

type Inicial = { tempoMs: number; derrubadas: number; recuos: number; quedaCavalo: boolean; forfait: boolean } | null;

export function FolhaSalto({ provaId, cavId, baremo, tempoConcedido, inicial }: {
  provaId: string; cavId: string; baremo: string; tempoConcedido: number; inicial: Inicial;
}) {
  const [tempo, setTempo] = useState(inicial ? (inicial.tempoMs / 1000).toFixed(2).replace(".", ",") : "");
  const [d, setD] = useState(inicial?.derrubadas ?? 0);
  const [r, setR] = useState(inicial?.recuos ?? 0);
  const [queda, setQueda] = useState(inicial?.quedaCavalo ?? false);
  const [ff, setFf] = useState(inicial?.forfait ?? false);
  const [msg, setMsg] = useState<string>();
  const [pend, start] = useTransition();
  const tipo = baremoPorId(baremo)?.tipo ?? "tempo_concedido";
  const tempoMs = Math.round((parseFloat(tempo.replace(",", ".")) || 0) * 1000);

  const res = useMemo(() => calcularPercurso({ tipo, tempoMs, tempoConcedido, derrubadas: d, recuos: r, quedaCavalo: queda, forfait: ff }),
    [tipo, tempoMs, tempoConcedido, d, r, queda, ff]);

  const stepBtn = "grid size-9 place-items-center rounded-md border border-line text-lg font-bold hover:border-red";
  const contador = (label: string, val: number, set: (n: number) => void) => (
    <div className="flex items-center justify-between rounded-lg border border-line bg-surf px-3 py-2.5">
      <span className="text-sm font-semibold">{label}</span>
      <span className="flex items-center gap-3">
        <button type="button" className={stepBtn} onClick={() => set(Math.max(0, val - 1))}>−</button>
        <b className="w-6 text-center font-mono text-lg">{val}</b>
        <button type="button" className={stepBtn} onClick={() => set(val + 1)}>+</button>
      </span>
    </div>
  );
  const salvar = (finalizar: boolean) => start(async () => {
    await salvarSalto(provaId, cavId, { tempoMs, derrubadas: d, recuos: r, quedaCavalo: queda, forfait: ff, finalizar });
    (finalizar ? somSucesso : somClique)();
    setMsg(finalizar ? "Resultado finalizado." : "Rascunho salvo.");
    setTimeout(() => setMsg(undefined), 2500);
  });

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold text-mut">Tempo do percurso (s)
          <input value={tempo} onChange={(e) => setTempo(e.target.value)} inputMode="decimal" placeholder="0,00"
            className="rounded-lg border border-line bg-surf px-3 py-2.5 font-mono text-lg outline-none focus:border-red" /></label>
        {contador("Derrubadas", d, setD)}
        {contador("Recuos / desobediências (a 2ª elimina)", r, setR)}
        <label className="flex items-center justify-between rounded-lg border border-line bg-surf px-3 py-2.5 text-sm font-semibold">
          Queda do cavalo / atleta <input type="checkbox" checked={queda} onChange={(e) => setQueda(e.target.checked)} className="size-5 accent-[var(--color-red)]" /></label>
        <label className="flex items-center justify-between rounded-lg border border-line bg-surf px-3 py-2.5 text-sm font-semibold">
          Forfait / desistência <input type="checkbox" checked={ff} onChange={(e) => setFf(e.target.checked)} className="size-5 accent-[var(--color-red)]" /></label>
      </div>

      <div className="flex h-fit flex-col gap-3 rounded-xl border border-line bg-surf p-5 shadow-sm">
        <div className="border-l-[3px] border-red pl-3">
          {res.status === "eliminado" ? (
            <><div className="text-2xl font-black text-red">ELIMINADO</div><div className="text-sm text-mut">{res.motivoEliminacao}</div></>
          ) : (
            <><div className="font-mono text-3xl font-bold tabular-nums">{tipo === "tempo_ideal" ? `${(res.diferencaIdeal ?? 0).toFixed(2).replace(".", ",")}s` : res.penalidadesTotais}</div>
              <div className="text-sm text-mut">{tipo === "tempo_ideal" ? "diferença ao ideal" : tipo === "tabela_c" ? "tempo total" : "penalidades"}</div></>
          )}
        </div>
        {res.status !== "eliminado" && tipo !== "tempo_ideal" && (
          <p className="text-sm text-mut">Faltas: <b className="text-ink">{res.penalidadesFaltas}</b> · Tempo: <b className="text-ink">{res.penalidadesTempo}</b></p>
        )}
        {msg && <p className="rounded-lg bg-okwash px-3 py-2 text-sm font-semibold text-ok">{msg}</p>}
        <button disabled={pend} onClick={() => salvar(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-red py-2.5 font-bold text-white hover:bg-red6 disabled:opacity-60"><IconSalvar width={17} height={17} /> Finalizar</button>
        <button disabled={pend} onClick={() => salvar(false)} className="rounded-lg border border-line py-2 text-sm font-semibold hover:border-red">Salvar rascunho</button>
      </div>
    </div>
  );
}
