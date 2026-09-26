"use client";
import { useState } from "react";
import { FolhaNotas, type PayloadNotas } from "@/components/folha-notas";
import type { Reprise } from "@/lib/domain/adestramento";
import { salvarAvaliacao } from "../actions";

type Mov = { num: number; local?: string; descricao: string; coeficiente: number };
type Conj = { num: number; descricao: string; coeficiente: number };
type Salva = { notasPista?: { num: number; nota: number }[]; notasConjunto?: { num: number; nota: number }[]; errosPercurso?: number };

export function FolhaAdestramento({ provaId, cavId, letras, reprise, salvas }: {
  provaId: string; cavId: string; letras: string[]; reprise: Reprise & { movimentos: Mov[]; notasConjunto: Conj[] }; salvas: Record<string, Salva>;
}) {
  const [letra, setLetra] = useState(letras[0]);
  const s = salvas[letra];
  const notas: Record<string, number> = {};
  (s?.notasPista || []).forEach((n) => { notas["m" + n.num] = n.nota; });
  (s?.notasConjunto || []).forEach((n) => { notas["c" + n.num] = n.nota; });

  return (
    <div>
      {letras.length > 1 && (
        <div className="mb-4 flex gap-1.5">
          {letras.map((l) => (
            <button key={l} onClick={() => setLetra(l)} className={`size-9 rounded-lg border font-bold transition ${l === letra ? "border-red bg-redwash text-red6" : "border-line hover:border-dim"}`}>{l}</button>
          ))}
        </div>
      )}
      <FolhaNotas
        key={letra}
        reprise={reprise}
        letra={letra}
        inicial={{ notas, erros: s?.errosPercurso ?? 0 }}
        cacheKey={`eqs_folha_admin_${letra}_${cavId}`}
        onSalvarParcial={(p: PayloadNotas) => salvarAvaliacao(provaId, cavId, letra, { ...p, finalizar: false })}
        onFinalizar={(p: PayloadNotas) => salvarAvaliacao(provaId, cavId, letra, { ...p, finalizar: true })}
      />
    </div>
  );
}
