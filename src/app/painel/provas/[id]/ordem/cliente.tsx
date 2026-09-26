"use client";
import { useMemo, useState, useTransition } from "react";
import { IconUp, IconDown, IconDado, IconSalvar, IconAlerta, IconRelogio } from "@/lib/icons";
import { salvarHorarios, salvarIntervalos, salvarOrdem, sortearOrdem, toggleMesclar } from "./actions";

type Item = { id: string; nome: string; posto: string; cavalo: string; chaveReprise: string; rotulo: string; ordemEntrada: number };

function GAPavisos(nomes: string[]): Set<number> {
  const s = new Set<number>();
  for (let i = 0; i < nomes.length; i++) for (let j = Math.max(0, i - 4); j < i; j++) if (nomes[j] === nomes[i]) s.add(i);
  return s;
}
function hora(inicio: string, min: number, i: number, extra = 0) {
  const [h, m] = inicio.split(":").map(Number);
  const t = h * 60 + m + i * min + extra;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
type Intervalo = { aposOrdem: number; minutos: number };

export function OrdemCliente({ provaId, mesclar, itens, inicio, minutos, intervalos }: {
  provaId: string; mesclar: boolean; itens: Item[]; avisosIniciais: number[]; inicio: string; minutos: number; intervalos: Intervalo[];
}) {
  const [lista, setLista] = useState(itens);
  const [sujo, setSujo] = useState(false);
  const [pend, start] = useTransition();
  const [ini, setIni] = useState(inicio);
  const [min, setMin] = useState(minutos);
  const [hMsg, setHMsg] = useState(false);
  const [intervs, setIntervs] = useState<Intervalo[]>(intervalos);
  const [novoApos, setNovoApos] = useState(1);
  const [novoMin, setNovoMin] = useState(15);
  const offset = (i: number) => intervs.filter((x) => x.aposOrdem <= i).reduce((sd, x) => sd + x.minutos, 0);
  const avisos = useMemo(() => GAPavisos(lista.map((i) => i.nome)), [lista]);

  const grupos = useMemo(() => {
    if (mesclar) return [{ rotulo: "", itens: lista }];
    const map = new Map<string, Item[]>();
    for (const it of lista) (map.get(it.chaveReprise) ?? map.set(it.chaveReprise, []).get(it.chaveReprise)!).push(it);
    return [...map.entries()].map(([k, v]) => ({ rotulo: v[0]?.rotulo ?? k, itens: v }));
  }, [lista, mesclar]);

  const mover = (id: string, d: number) => {
    setLista((L) => {
      const arr = L.slice();
      const i = arr.findIndex((x) => x.id === id);
      const j = i + d;
      if (j < 0 || j >= arr.length) return L;
      if (!mesclar && arr[i].chaveReprise !== arr[j].chaveReprise) return L; // não cruza reprises
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
    setSujo(true);
  };

  let idx = 0;
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-4 rounded-xl border border-line bg-surf2 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-mut"><IconRelogio width={18} height={18} className="text-red" /> Grade de horários</div>
        <label className="text-xs font-semibold text-mut">Início
          <input type="time" value={ini} onChange={(e) => setIni(e.target.value)} className="mt-1 block rounded-lg border border-line bg-surf px-3 py-2 font-mono text-sm outline-none focus:border-red" />
        </label>
        <label className="text-xs font-semibold text-mut">Min. por conjunto
          <input type="number" min={1} max={60} value={min} onChange={(e) => setMin(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-line bg-surf px-3 py-2 font-mono text-sm outline-none focus:border-red" />
        </label>
        <button type="button" disabled={pend || (ini === inicio && min === minutos)}
          onClick={() => start(async () => { await salvarHorarios(provaId, ini, min); setHMsg(true); setTimeout(() => setHMsg(false), 2000); })}
          className="rounded-lg border border-line bg-surf px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:border-red disabled:opacity-50">Aplicar</button>
        {hMsg && <span className="text-sm font-semibold text-ok">Horários atualizados.</span>}

        <div className="w-full border-t border-line pt-3">
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-mut">Intervalos</div>
          {intervs.length > 0 && (
            <ul className="mb-2 flex flex-wrap gap-2">
              {intervs.map((iv, k) => (
                <li key={k} className="inline-flex items-center gap-1.5 rounded-full bg-surf px-3 py-1 text-sm shadow-sm">
                  Após o {iv.aposOrdem}º · <b>{iv.minutos} min</b>
                  <button type="button" aria-label="Remover intervalo" onClick={() => setIntervs((L) => L.filter((_, j) => j !== k))} className="text-mut hover:text-red">×</button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-mut">Após o conjunto nº
              <input type="number" min={1} value={novoApos} onChange={(e) => setNovoApos(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-line bg-surf px-3 py-2 font-mono text-sm outline-none focus:border-red" />
            </label>
            <label className="text-xs font-semibold text-mut">Minutos
              <input type="number" min={1} max={240} value={novoMin} onChange={(e) => setNovoMin(Number(e.target.value))} className="mt-1 block w-24 rounded-lg border border-line bg-surf px-3 py-2 font-mono text-sm outline-none focus:border-red" />
            </label>
            <button type="button" onClick={() => setIntervs((L) => [...L.filter((x) => x.aposOrdem !== novoApos), { aposOrdem: novoApos, minutos: novoMin }].sort((a, b) => a.aposOrdem - b.aposOrdem))}
              className="rounded-lg border border-line bg-surf px-3.5 py-2 text-sm font-semibold shadow-sm transition hover:border-red">Adicionar</button>
            <button type="button" disabled={pend} onClick={() => start(async () => { await salvarIntervalos(provaId, intervs); setHMsg(true); setTimeout(() => setHMsg(false), 2000); })}
              className="rounded-lg bg-red px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-red6 disabled:opacity-60">Salvar intervalos</button>
          </div>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" role="switch" aria-checked={mesclar}
          onClick={() => start(async () => { await toggleMesclar(provaId, !mesclar); })}
          className="inline-flex items-center gap-2.5 text-sm font-bold">
          <span className={`relative h-6 w-11 rounded-full transition ${mesclar ? "bg-red" : "bg-[#d6d6db]"}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition ${mesclar ? "left-[22px]" : "left-0.5"}`} />
          </span>
          Mesclar reprises
        </button>
        <div className="flex gap-2">
          <button type="button" disabled={pend} onClick={() => start(async () => { await sortearOrdem(provaId); location.reload(); })}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surf px-3.5 py-2 text-sm font-semibold shadow-sm hover:border-red disabled:opacity-60">
            <IconDado width={16} height={16} /> Sortear ordem
          </button>
          <button type="button" disabled={!sujo || pend}
            onClick={() => start(async () => { await salvarOrdem(provaId, lista.map((i) => i.id)); setSujo(false); })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red px-3.5 py-2 text-sm font-bold text-white shadow-sm hover:bg-red6 disabled:opacity-50">
            <IconSalvar width={16} height={16} /> Salvar ordem
          </button>
        </div>
      </div>

      {lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Nenhum inscrito. Adicione na aba Inscrições.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
          {grupos.map((g) => (
            <div key={g.rotulo || "todos"}>
              {!mesclar && <div className="border-t border-line2 bg-surf2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-red6 first:border-0">{g.rotulo}</div>}
              {g.itens.map((it) => {
                const i = idx++;
                const alerta = avisos.has(i);
                const iv = intervs.find((x) => x.aposOrdem === i + 1);
                return (
                  <div key={it.id}>
                  <div className="grid grid-cols-[34px_52px_1fr_auto] items-center gap-3 border-t border-line2 px-3 py-2.5">
                    <span className="text-center font-mono font-bold text-red">{i + 1}º</span>
                    <span className="font-mono text-sm text-mut tabular-nums">{hora(ini, min, i, offset(i))}</span>
                    <span>
                      <span className="block font-semibold">{[it.posto, it.nome].filter(Boolean).join(" ")}
                        {mesclar && <span className="ml-1.5 rounded bg-redwash px-1.5 py-0.5 align-[1px] text-[10px] font-bold text-red6">{it.rotulo}</span>}
                      </span>
                      <span className="block text-sm text-mut">{it.cavalo}</span>
                      {alerta && <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-warn"><IconAlerta width={13} height={13} /> Monta de novo em seguida — pouco tempo para trocar de cavalo</span>}
                    </span>
                    <span className="flex gap-1">
                      <button onClick={() => mover(it.id, -1)} aria-label="Subir" className="grid size-8 place-items-center rounded-md border border-line hover:border-red hover:text-red"><IconUp width={15} height={15} /></button>
                      <button onClick={() => mover(it.id, 1)} aria-label="Descer" className="grid size-8 place-items-center rounded-md border border-line hover:border-red hover:text-red"><IconDown width={15} height={15} /></button>
                    </span>
                  </div>
                  {iv && (
                    <div className="flex items-center gap-2 border-t border-line2 bg-warnwash px-3 py-1.5 text-xs font-semibold text-warn">
                      <IconRelogio width={13} height={13} /> Intervalo de {iv.minutos} min
                    </div>
                  )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-sm text-mut">Com <strong>Mesclar</strong> ligado a ordem vira uma fila única e o sorteio deixa pelo menos 4 conjuntos entre as montarias da mesma pessoa.</p>
    </div>
  );
}
