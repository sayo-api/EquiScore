"use client";
import { useEffect, useState } from "react";
import type { GrupoResultado } from "@/lib/domain/resultados";
import { ResultadoGrupos } from "@/components/resultado-grupos";
import { IconTv } from "@/lib/icons";

type EmPista = { conjunto: string; cavalo: string; reprise: string } | null;

export function TelaoVivo({ provaId, telao }: { provaId: string; telao: boolean }) {
  const [grupos, setGrupos] = useState<GrupoResultado[] | null>(null);
  const [emPista, setEmPista] = useState<EmPista>(null);
  const [erro, setErro] = useState(false);
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
  if (grupos === null) return <p className="p-8 text-center text-mut">{erro ? "Não foi possível carregar." : "Carregando…"}</p>;
  return (
    <div className="flex flex-col gap-6">
      {emPista && (
        <div className={`flex items-center gap-4 rounded-xl border border-red bg-redwash shadow-sm eqs-pop ${telao ? "p-6" : "p-4"}`}>
          <span className={`grid shrink-0 place-items-center rounded-xl bg-red text-white ${telao ? "size-16" : "size-11"}`}><IconTv width={telao ? 30 : 20} height={telao ? 30 : 20} /></span>
          <div className="min-w-0 flex-1">
            <div className={`font-bold uppercase tracking-wider text-red6 ${telao ? "text-base" : "text-xs"}`}>Em pista agora</div>
            <div className={`truncate font-black ${telao ? "text-3xl" : "text-lg"}`}>{emPista.conjunto}</div>
            <div className={`truncate text-mut ${telao ? "text-xl" : "text-sm"}`}>{emPista.cavalo}{emPista.reprise ? ` · ${emPista.reprise}` : ""}</div>
          </div>
        </div>
      )}
      <ResultadoGrupos grupos={grupos} telao={telao} />
    </div>
  );
}
