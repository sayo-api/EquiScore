"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";

async function dono(provaId: string) {
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(provaId, userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return { prova, userId };
}
const rev = (id: string) => revalidatePath(`/painel/provas/${id}/inscricoes`);

export async function adicionarInscricao(provaId: string, form: FormData): Promise<{ erro?: string }> {
  const { prova } = await dono(provaId);
  const nome = String(form.get("nome") || "").trim();
  const cavalo = String(form.get("cavalo") || "").trim();
  if (!nome || !cavalo) return { erro: "Informe cavaleiro e cavalo." };
  await conectar();
  const repriseId = prova.tipo === "ADESTRAMENTO" ? String(form.get("repriseId") || "") : "";
  if (prova.tipo === "ADESTRAMENTO" && !repriseId) return { erro: "Selecione a reprise." };
  if (prova.tipo === "ADESTRAMENTO" && !(prova.reprises as Types.ObjectId[]).map(String).includes(repriseId))
    return { erro: "Reprise inválida." };
  const filtroOrdem = prova.tipo === "ADESTRAMENTO"
    ? { provaId: prova._id, repriseId: new Types.ObjectId(repriseId) }
    : { provaId: prova._id };
  const ultimo = await Cavaleiro.findOne(filtroOrdem).sort({ ordemEntrada: -1 }).lean<{ ordemEntrada?: number }>();
  await Cavaleiro.create({
    nome, cavalo,
    postoGraduacao: String(form.get("postoGraduacao") || "").trim(),
    categoria: String(form.get("categoria") || "").trim(),
    provaId: prova._id, ownerId: prova.ownerId,
    repriseId: repriseId ? new Types.ObjectId(repriseId) : null,
    ordemEntrada: (ultimo?.ordemEntrada || 0) + 1,
    status: "AGUARDANDO",
  });
  rev(provaId);
  return {};
}

export async function aprovar(provaId: string, cavId: string) {
  await dono(provaId);
  await conectar();
  await Cavaleiro.updateOne({ _id: cavId, provaId }, { $set: { status: "AGUARDANDO" } });
  rev(provaId);
}
export async function remover(provaId: string, cavId: string) {
  await dono(provaId);
  await conectar();
  await Cavaleiro.deleteOne({ _id: cavId, provaId });
  rev(provaId);
}

export async function editarInscricao(provaId: string, cavId: string, dados: {
  nome: string; postoGraduacao: string; cavalo: string; repriseId?: string; categoria?: string;
}): Promise<{ erro?: string }> {
  const { prova } = await dono(provaId);
  if (!Types.ObjectId.isValid(cavId)) return { erro: "Id inválido." };
  const nome = dados.nome.trim();
  const cavalo = dados.cavalo.trim();
  if (!nome || !cavalo) return { erro: "Informe cavaleiro e cavalo." };
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId: prova._id });
  if (!cav) return { erro: "Inscrição não encontrada." };

  const update: Record<string, unknown> = { nome, cavalo, postoGraduacao: dados.postoGraduacao.trim() };
  if (prova.tipo === "ADESTRAMENTO") {
    const repriseId = String(dados.repriseId || "");
    if (!(prova.reprises as Types.ObjectId[]).map(String).includes(repriseId)) return { erro: "Reprise inválida." };
    // Ao trocar de reprise, recomeça no fim da nova fila e move as avaliações.
    if (String(cav.repriseId) !== repriseId) {
      const ultimo = await Cavaleiro.findOne({ provaId: prova._id, repriseId: new Types.ObjectId(repriseId) }).sort({ ordemEntrada: -1 }).lean<{ ordemEntrada?: number }>();
      update.repriseId = new Types.ObjectId(repriseId);
      update.ordemEntrada = (ultimo?.ordemEntrada || 0) + 1;
      const { Avaliacao } = await import("@/lib/server/models");
      await Avaliacao.updateMany({ cavaleiroId: cav._id }, { $set: { repriseId: new Types.ObjectId(repriseId) } });
    }
  } else {
    update.categoria = String(dados.categoria || "").trim();
  }
  await Cavaleiro.updateOne({ _id: cav._id }, { $set: update });
  rev(provaId);
  return {};
}
