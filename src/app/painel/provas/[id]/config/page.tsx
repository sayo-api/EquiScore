import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { BAREMOS } from "@/lib/domain/salto";
import { ConfigProva } from "./cliente";

const dataInput = (d: unknown) => (d ? new Date(d as string).toISOString().slice(0, 10) : "");

export default async function Config({ params }: PageProps<"/painel/provas/[id]/config">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const catalogo = await Reprise.find({ ownerId: null }, { nome: 1 }).lean();
  const selecionadas = ((prova.reprises as Types.ObjectId[]) || []).map(String);
  return (
    <ConfigProva
      provaId={id}
      tipo={String(prova.tipo)}
      status={String(prova.status || "ATIVA")}
      valores={{
        nome: String(prova.nome || ""), local: String(prova.local || ""), data: dataInput(prova.data),
        numJuizes: Number(prova.numJuizes || 1), baremo: String(prova.baremo || "220.2.1.1"),
        tempoConcedido: Number(prova.tempoConcedido || 80), tempoIdeal: prova.tempoIdeal ? Number(prova.tempoIdeal) : undefined,
      }}
      reprises={catalogo.map((r) => ({ id: String(r._id), nome: String(r.nome) }))}
      selecionadas={selecionadas}
      baremos={BAREMOS.map((b) => ({ id: b.id, nome: b.nome }))}
    />
  );
}
