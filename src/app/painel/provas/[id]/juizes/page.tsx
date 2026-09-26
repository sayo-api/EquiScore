import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Juiz } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { GerenciarJuizes, type JuizLinha } from "./cliente";

export default async function JuizesPage({ params }: PageProps<"/painel/provas/[id]/juizes">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const docs = await Juiz.find({ provaId: new Types.ObjectId(String(prova._id)) }).sort({ juizLetra: 1 }).lean();
  const juizes: JuizLinha[] = docs.map((j) => ({
    id: String(j._id),
    usuario: String(j.username || ""),
    nome: String(j.nome || ""),
    letra: String(j.juizLetra || "C"),
  }));
  const numJuizes = Math.max(1, Math.min(5, Number(prova.numJuizes || 1)));
  return <GerenciarJuizes provaId={id} juizes={juizes} numJuizes={numJuizes} />;
}
