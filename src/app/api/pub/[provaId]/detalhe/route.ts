import { NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Reprise } from "@/lib/server/models";

/** Notas por movimento de cada juiz para um conjunto (usado no acompanhar). */
export async function GET(req: Request, { params }: RouteContext<"/api/pub/[provaId]/detalhe"> ) {
  const { provaId } = await params;
  const cav = new URL(req.url).searchParams.get("cav") || "";
  if (!isValidObjectId(provaId) || !isValidObjectId(cav)) return NextResponse.json({ erro: "inválido" }, { status: 400 });
  await conectar();
  const conjunto = await Cavaleiro.findOne({ _id: cav, provaId }).lean<Record<string, unknown>>();
  if (!conjunto) return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  const reprise = await Reprise.findById(conjunto.repriseId).lean<Record<string, unknown>>();
  const avals = await Avaliacao.find({ cavaleiroId: cav, repriseId: conjunto.repriseId }).lean<Record<string, unknown>[]>();

  const limpa = (arr: unknown) => ((arr as { num: number; nota: number | null; obs?: string }[]) || []).map((n) => ({ num: n.num, nota: n.nota ?? null, obs: n.obs || "" }));
  return NextResponse.json({
    conjunto: { nome: [conjunto.postoGraduacao, conjunto.nome].filter(Boolean).join(" "), cavalo: String(conjunto.cavalo || "") },
    reprise: reprise ? {
      nome: String(reprise.nome || ""),
      movimentos: (reprise.movimentos as { num: number; descricao: string; coeficiente: number }[]) || [],
      notasConjunto: (reprise.notasConjunto as { num: number; descricao: string; coeficiente: number }[]) || [],
    } : null,
    avaliacoes: avals.map((a) => ({
      juizLetra: String(a.juizLetra || "C"),
      status: String(a.status || ""),
      percentualFinal: Number(a.percentualFinal || 0),
      notasPista: limpa(a.notasPista),
      notasConjunto: limpa(a.notasConjunto),
    })),
  }, { headers: { "Cache-Control": "public, max-age=0, s-maxage=5" } });
}
