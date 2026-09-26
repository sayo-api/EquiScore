import type { GrupoResultado } from "@/lib/domain/resultados";

/** Tabela de resultados reaproveitada por admin, telão e acompanhar. */
export function ResultadoGrupos({ grupos, telao = false }: { grupos: GrupoResultado[]; telao?: boolean }) {
  if (!grupos.length) return <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Sem resultados ainda.</p>;
  return (
    <div className="flex flex-col gap-6">
      {grupos.map((g) => (
        <section key={g.titulo} className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
          <div className="flex items-center justify-between bg-red6 px-4 py-2.5">
            <h2 className={`font-bold uppercase tracking-wider text-white ${telao ? "text-lg" : "text-sm"}`}>{g.titulo}</h2>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{g.juizes?.length ? "% por juiz · média" : g.colunaValor}</span>
          </div>
          {g.juizes?.length ? <TabelaPorJuiz g={g} telao={telao} /> : <ListaSimples g={g} telao={telao} />}
        </section>
      ))}
    </div>
  );
}

function ListaSimples({ g, telao }: { g: GrupoResultado; telao: boolean }) {
  return (
    <ul>
      {g.linhas.map((l, i) => (
        <li key={i} className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 border-t border-line2 px-4 ${telao ? "py-3" : "py-2.5"} first:border-0`}>
          <span className={`text-center font-mono font-bold ${l.posicao ? "text-red" : "text-dim"} ${telao ? "text-xl" : ""}`}>{l.posicao ? `${l.posicao}º` : "—"}</span>
          <span>
            <span className={`block font-semibold ${telao ? "text-lg" : ""}`}>{l.conjunto}</span>
            <span className={`block text-mut ${telao ? "text-base" : "text-sm"}`}>{l.cavalo}</span>
          </span>
          <span className={`text-right font-mono font-bold tabular-nums ${l.eliminado ? "text-red" : ""} ${telao ? "text-xl" : ""}`}>{l.resumo}</span>
        </li>
      ))}
    </ul>
  );
}

function TabelaPorJuiz({ g, telao }: { g: GrupoResultado; telao: boolean }) {
  const juizes = g.juizes || [];
  const cel = telao ? "px-3 py-3 text-base" : "px-3 py-2.5 text-sm";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-mut">
            <th className={`${cel} text-center font-bold`}>Col.</th>
            <th className={`${cel} text-left font-bold`}>Conjunto</th>
            {juizes.map((l) => <th key={l} className={`${cel} text-center font-bold`}>Juiz {l}</th>)}
            <th className={`${cel} text-right font-bold`}>Média</th>
          </tr>
        </thead>
        <tbody>
          {g.linhas.map((l, i) => (
            <tr key={i} className="border-t border-line2 first:border-0">
              <td className={`${cel} text-center font-mono font-bold ${l.posicao ? "text-red" : "text-dim"}`}>{l.posicao ? `${l.posicao}º` : "—"}</td>
              <td className={cel}>
                <span className={`block font-semibold ${telao ? "text-lg" : ""}`}>{l.conjunto}</span>
                <span className="block text-xs text-mut">{l.cavalo}</span>
              </td>
              {(l.porJuiz || []).map((j) => (
                <td key={j.letra} className={`${cel} text-center font-mono tabular-nums`}>
                  <span className={j.valor === "EL" ? "font-bold text-red" : ""}>{j.valor}</span>
                  {j.posicao != null && <span className="ml-1 align-super text-[10px] font-bold text-dim">({j.posicao})</span>}
                </td>
              ))}
              <td className={`${cel} text-right font-mono font-bold tabular-nums ${l.eliminado ? "text-red" : ""}`}>{l.resumo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
