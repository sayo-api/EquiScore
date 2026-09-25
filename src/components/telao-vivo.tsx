"use client";
import { useEffect, useState } from "react";
import type { GrupoResultado } from "@/lib/domain/resultados";
import { ResultadoGrupos } from "@/components/resultado-grupos";

export function TelaoVivo({ provaId, telao }: { provaId: string; telao: boolean }) {
  const [grupos, setGrupos] = useState<GrupoResultado[] | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    const buscar = async () => {
      try {
        const r = await fetch(`/api/pub/${provaId}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        const d = await r.json();
        if (vivo) { setGrupos(d.grupos); setErro(false); }
      } catch { if (vivo) setErro(true); }
    };
    buscar();
    const t = setInterval(() => { if (!document.hidden) buscar(); }, 10000);
    const vis = () => { if (!document.hidden) buscar(); };
    document.addEventListener("visibilitychange", vis);
    return () => { vivo = false; clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [provaId]);
  if (grupos === null) return <p className="p-8 text-center text-mut">{erro ? "Não foi possível carregar." : "Carregando…"}</p>;
  return <ResultadoGrupos grupos={grupos} telao={telao} />;
}
