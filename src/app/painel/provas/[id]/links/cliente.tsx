"use client";
import { useState } from "react";
import { IconUsuarios, IconTv, IconCelular, IconCopiar, IconCheck } from "@/lib/icons";

function Cartao({ Icon, titulo, desc, path }: { Icon: typeof IconTv; titulo: string; desc: string; path: string }) {
  const [copiado, setCopiado] = useState(false);
  const url = typeof window !== "undefined" ? window.location.origin + path : path;
  const copiar = async () => { try { await navigator.clipboard.writeText(url); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch { /* ignora */ } };
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-surf p-5 shadow-sm">
      <div className="flex items-center gap-2 font-bold"><span className="text-red"><Icon width={20} height={20} /></span> {titulo}</div>
      <p className="text-sm text-mut">{desc}</p>
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="min-w-0 flex-1 rounded-lg border border-line bg-surf2 px-3 py-2 font-mono text-xs" />
        <button onClick={copiar} className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:border-red">
          {copiado ? <><IconCheck width={15} height={15} /> Copiado</> : <><IconCopiar width={15} height={15} /> Copiar</>}
        </button>
      </div>
      <a href={path} target="_blank" className="text-sm font-semibold text-red hover:underline">Abrir</a>
    </div>
  );
}

export function CartoesLink({ provaId }: { provaId: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Cartao Icon={IconUsuarios} titulo="Inscrição pública" desc="Compartilhe para os competidores se inscreverem (entram como pendentes)." path={`/inscricao/${provaId}`} />
      <Cartao Icon={IconTv} titulo="Telão de resultados" desc="Projete numa tela; atualiza sozinho a cada poucos segundos." path={`/telao/${provaId}`} />
      <Cartao Icon={IconCelular} titulo="Acompanhar no celular" desc="Link do público para ver os resultados no celular." path={`/r/${provaId}`} />
    </div>
  );
}
