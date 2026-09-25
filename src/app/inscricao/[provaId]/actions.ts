"use server";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova } from "@/lib/server/models";

export type EstadoInsc = { erro?: string; ok?: boolean } | undefined;

export async function inscrever(provaId: string, _: EstadoInsc, form: FormData): Promise<EstadoInsc> {
  if (!Types.ObjectId.isValid(provaId)) return { erro: "Prova inválida." };
  await conectar();
  const prova = await Prova.findById(provaId).lean<Record<string, unknown>>();
  if (!prova || prova.status !== "ATIVA") return { erro: "As inscrições desta prova estão encerradas." };
  const nome = String(form.get("nome") || "").trim();
  const cavalo = String(form.get("cavalo") || "").trim();
  if (!nome || !cavalo) return { erro: "Preencha o nome do cavaleiro e do cavalo." };
  const repriseId = prova.tipo === "ADESTRAMENTO" ? String(form.get("repriseId") || "") : "";
  if (prova.tipo === "ADESTRAMENTO") {
    if (!repriseId || !(prova.reprises as Types.ObjectId[]).map(String).includes(repriseId)) return { erro: "Selecione a reprise." };
  }
  await Cavaleiro.create({
    nome, cavalo,
    postoGraduacao: String(form.get("postoGraduacao") || "").trim(),
    categoria: String(form.get("categoria") || "").trim(),
    email: String(form.get("email") || "").trim(),
    telefone: String(form.get("telefone") || "").trim(),
    provaId: prova._id, ownerId: prova.ownerId,
    repriseId: repriseId ? new Types.ObjectId(repriseId) : null,
    ordemEntrada: 0, status: "PENDENTE",
  });
  return { ok: true };
}
