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
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">{g.colunaValor}</span>
          </div>
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
        </section>
      ))}
    </div>
  );
}
