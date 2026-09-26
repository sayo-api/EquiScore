"use client";
import { useRouter } from "next/navigation";
import { FolhaNotas, type PayloadNotas } from "@/components/folha-notas";
import type { Reprise } from "@/lib/domain/adestramento";
import { salvarNotaJuiz } from "@/app/juiz/actions";

type Mov = { num: number; local?: string; descricao: string; coeficiente: number };
type Conj = { num: number; descricao: string; coeficiente: number };
type NS = { num: number; nota: number; obs?: string };
type Salva = { notasPista?: NS[]; notasConjunto?: NS[]; errosPercurso?: number };

export function FolhaJuiz({ repriseId, cavId, letra, reprise, salva }: {
  repriseId: string; cavId: string; letra: string; reprise: Reprise & { movimentos: Mov[]; notasConjunto: Conj[] }; salva: Salva | null;
}) {
  const router = useRouter();
  const notas: Record<string, number> = {};
  const obs: Record<string, string> = {};
  (salva?.notasPista || []).forEach((n) => { if (n.nota != null) notas["m" + n.num] = n.nota; if (n.obs) obs["m" + n.num] = n.obs; });
  (salva?.notasConjunto || []).forEach((n) => { if (n.nota != null) notas["c" + n.num] = n.nota; if (n.obs) obs["c" + n.num] = n.obs; });

  return (
    <FolhaNotas
      reprise={reprise}
      letra={letra}
      inicial={{ notas, obs, erros: salva?.errosPercurso ?? 0 }}
      cacheKey={`eqs_folha_${letra}_${cavId}`}
      onSalvarParcial={(p: PayloadNotas) => salvarNotaJuiz(cavId, { ...p, finalizar: false })}
      onFinalizar={(p: PayloadNotas) => salvarNotaJuiz(cavId, { ...p, finalizar: true })}
      aposFinalizar={() => { router.push(`/juiz/reprise/${repriseId}`); router.refresh(); }}
    />
  );
}
