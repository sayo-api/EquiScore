"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { registrar } from "@/lib/server/auditoria";
import { camposDoForm } from "@/lib/server/cadastro";

async function dono(provaId: string) {
  const s = await exigirSessao();
  const prova = await provaDoDono(provaId, s.userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return { prova, userId: s.userId, autor: s.nome || "" };
}
const rev = (id: string) => revalidatePath(`/painel/provas/${id}/inscricoes`);

export async function adicionarInscricao(provaId: string, form: FormData): Promise<{ erro?: string }> {
  const { prova, autor: autorAdd } = await dono(provaId);
  const campos = camposDoForm(form);
  if (!campos.nome || !campos.cavalo) return { erro: "Informe cavaleiro e cavalo." };
  await conectar();
  const repriseId = prova.tipo === "ADESTRAMENTO" ? String(form.get("repriseId") || "") : "";
  if (prova.tipo === "ADESTRAMENTO" && !repriseId) return { erro: "Selecione a reprise." };
  if (prova.tipo === "ADESTRAMENTO" && !(prova.reprises as Types.ObjectId[]).map(String).includes(repriseId))
    return { erro: "Reprise inválida." };
  const categoria = prova.tipo === "SALTO" ? String(form.get("categoria") || form.get("altura") || "").trim() : campos.categoria;
  const filtroOrdem = prova.tipo === "ADESTRAMENTO"
    ? { provaId: prova._id, repriseId: new Types.ObjectId(repriseId) }
    : { provaId: prova._id };
  const ultimo = await Cavaleiro.findOne(filtroOrdem).sort({ ordemEntrada: -1 }).lean<{ ordemEntrada?: number }>();
  await Cavaleiro.create({
    ...campos, categoria,
    provaId: prova._id, ownerId: prova.ownerId,
    repriseId: repriseId ? new Types.ObjectId(repriseId) : null,
    ordemEntrada: (ultimo?.ordemEntrada || 0) + 1,
    status: "AGUARDANDO",
  });
  await registrar(prova, autorAdd, "Inscrição adicionada", `${campos.nome} · ${campos.cavalo}`);
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
  const { prova, autor } = await dono(provaId);
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId }).lean<{ nome?: string; cavalo?: string }>();
  await Cavaleiro.deleteOne({ _id: cavId, provaId });
  await registrar(prova, autor, "Inscrição removida", cav ? `${cav.nome} · ${cav.cavalo}` : cavId);
  rev(provaId);
}

export async function editarInscricao(provaId: string, cavId: string, dados: {
  nome: string; postoGraduacao: string; cavalo: string; repriseId?: string; categoria?: string;
  cavaloFiliacao?: string; cavaloPai?: string; cavaloMae?: string; tratador?: string; equipe?: string; email?: string; telefone?: string;
}): Promise<{ erro?: string }> {
  const { prova, autor: autorEd } = await dono(provaId);
  if (!Types.ObjectId.isValid(cavId)) return { erro: "Id inválido." };
  const nome = dados.nome.trim();
  const cavalo = dados.cavalo.trim();
  if (!nome || !cavalo) return { erro: "Informe cavaleiro e cavalo." };
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId: prova._id });
  if (!cav) return { erro: "Inscrição não encontrada." };

  const update: Record<string, unknown> = {
    nome, cavalo, postoGraduacao: dados.postoGraduacao.trim(),
    cavaloFiliacao: (dados.cavaloFiliacao || "").trim(), cavaloPai: (dados.cavaloPai || "").trim(),
    cavaloMae: (dados.cavaloMae || "").trim(), tratador: (dados.tratador || "").trim(),
    equipe: (dados.equipe || "").trim(), email: (dados.email || "").trim(), telefone: (dados.telefone || "").trim(),
  };
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
  await registrar(prova, autorEd, "Inscrição editada", `${nome} · ${cavalo}`);
  rev(provaId);
  return {};
}
