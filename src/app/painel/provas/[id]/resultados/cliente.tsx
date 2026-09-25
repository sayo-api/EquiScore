"use client";
import { useState, useTransition } from "react";
import { IconTrofeu, IconPdf, IconX } from "@/lib/icons";
import { despublicar, publicar } from "./actions";
import { somPublicar, somClique } from "@/lib/som";

export function BotoesPublicar({ provaId, publicado, pdfUrl }: { provaId: string; publicado: boolean; pdfUrl: string | null }) {
  const [pend, start] = useTransition();
  const [url, setUrl] = useState(pdfUrl);
  const [pub, setPub] = useState(publicado);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button disabled={pend} onClick={() => start(async () => { const r = await publicar(provaId); setUrl(r.pdfUrl ?? url); setPub(true); somPublicar(); })}
        className="inline-flex items-center gap-2 rounded-lg bg-red px-4 py-2.5 font-bold text-white shadow-sm hover:bg-red6 disabled:opacity-60">
        <IconTrofeu width={18} height={18} /> {pub ? "Republicar resultados" : "Publicar resultados"}
      </button>
      <a href={`/api/prova/${provaId}/pdf`} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-line bg-surf px-4 py-2.5 font-semibold shadow-sm hover:border-red">
        <IconPdf width={18} height={18} /> Ver PDF
      </a>
      {url && <a href={url} target="_blank" className="text-sm font-semibold text-red hover:underline">PDF publicado</a>}
      {pub && (
        <button disabled={pend} onClick={() => start(async () => { await despublicar(provaId); setPub(false); somClique(); })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm font-semibold text-mut hover:border-red hover:text-red">
          <IconX width={15} height={15} /> Despublicar
        </button>
      )}
      <span className="text-sm text-mut">{pub ? "Publicado — visível no telão e no link de acompanhar." : "Ainda não publicado."}</span>
    </div>
  );
}
