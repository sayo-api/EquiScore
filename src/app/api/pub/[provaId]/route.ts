import { NextResponse } from "next/server";
import { montarResultados, provaPublica } from "@/lib/server/consultas";

/** Resultados públicos de uma prova (telão/acompanhar fazem polling aqui). */
export async function GET(_: Request, { params }: RouteContext<"/api/pub/[provaId]">) {
  const { provaId } = await params;
  const prova = await provaPublica(provaId);
  if (!prova) return NextResponse.json({ erro: "Prova não encontrada." }, { status: 404 });
  const grupos = await montarResultados(prova);
  return NextResponse.json(
    { prova: { nome: prova.nome, local: prova.local, tipo: prova.tipo }, grupos },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=5" } },
  );
}
