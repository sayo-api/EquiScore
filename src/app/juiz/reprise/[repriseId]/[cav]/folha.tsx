"use client";
import { useRouter } from "next/navigation";
import { FolhaNotas, type PayloadNotas } from "@/components/folha-notas";
import type { Reprise } from "@/lib/domain/adestramento";
import { salvarNotaJuiz } from "@/app/juiz/actions";

type Mov = { num: number; local?: string; descricao: string; coeficiente: number };
type Conj = { num: number; descricao: string; coeficiente: number };
type Salva = { notasPista?: { num: number; nota: number }[]; notasConjunto?: { num: number; nota: number }[]; errosPercurso?: number };

export function FolhaJuiz({ repriseId, cavId, letra, reprise, salva }: {
  repriseId: string; cavId: string; letra: string; reprise: Reprise & { movimentos: Mov[]; notasConjunto: Conj[] }; salva: Salva | null;
}) {
  const router = useRouter();
  const notas: Record<string, number> = {};
  (salva?.notasPista || []).forEach((n) => { notas["m" + n.num] = n.nota; });
  (salva?.notasConjunto || []).forEach((n) => { notas["c" + n.num] = n.nota; });

  return (
    <FolhaNotas
      reprise={reprise}
      letra={letra}
      inicial={{ notas, erros: salva?.errosPercurso ?? 0 }}
      cacheKey={`eqs_folha_${letra}_${cavId}`}
      onSalvarParcial={(p: PayloadNotas) => salvarNotaJuiz(cavId, { ...p, finalizar: false })}
      onFinalizar={(p: PayloadNotas) => salvarNotaJuiz(cavId, { ...p, finalizar: true })}
      aposFinalizar={() => { router.push(`/juiz/reprise/${repriseId}`); router.refresh(); }}
    />
  );
}
