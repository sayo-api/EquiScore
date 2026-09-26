"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { registrar } from "@/lib/server/auditoria";
import {sortear, type Conjunto} from "@/lib/domain/ordem";

async function dono(provaId: string) {
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(provaId, userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return prova;
}
async function autorAtual() { const s = await exigirSessao(); return s.nome || ""; }
const chave = (c: { repriseId?: unknown; categoria?: unknown }, tipo: string) =>
  tipo === "ADESTRAMENTO" ? String(c.repriseId || "") : String(c.categoria || "");
const rev = (id: string) => revalidatePath(`/painel/provas/${id}/ordem`);

/** Ordem das reprises/categorias conforme a prova. */
async function ordemChaves(prova: Record<string, unknown>): Promise<string[]> {
  if (prova.tipo === "ADESTRAMENTO") return ((prova.reprises as Types.ObjectId[]) || []).map(String);
  const cats = await Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).distinct("categoria");
  return cats.map(String);
}

export async function toggleMesclar(provaId: string, mesclar: boolean) {
  const prova = await dono(provaId);
  await conectar();
  await Prova.updateOne({ _id: prova._id }, { $set: { mesclar } });
  rev(provaId);
}

export async function salvarOrdem(provaId: string, ids: string[]) {
  await dono(provaId);
  await conectar();
  const ops = ids.map((id, i) => ({ updateOne: { filter: { _id: id, provaId }, update: { $set: { ordemEntrada: i + 1 } } } }));
  if (ops.length) await Cavaleiro.bulkWrite(ops);
  rev(provaId);
}

export async function sortearOrdem(provaId: string) {
  const prova = await dono(provaId);
  await conectar();
  const comps = await Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).lean();
  const conj: Conjunto[] = comps.map((c) => ({ id: String(c._id), nome: String(c.nome), chaveReprise: chave(c, String(prova.tipo)) }));
  const ordem = await ordemChaves(prova);
  const sorteada = sortear(conj, !!prova.mesclar, ordem);
  await salvarOrdem(provaId, sorteada.map((c) => c.id));
  await registrar(prova, await autorAtual(), "Ordem sorteada", `${sorteada.length} conjuntos`);
}

/** Salva o horário de início e os minutos por conjunto (grade de horários). */
export async function salvarHorarios(provaId: string, inicio: string, minutos: number) {
  const prova = await dono(provaId);
  await conectar();
  const hhmm = /^([01]?\d|2[0-3]):[0-5]\d$/.test(inicio) ? inicio : "08:00";
  const min = Math.max(1, Math.min(60, Math.round(minutos) || 7));
  await Prova.updateOne({ _id: prova._id }, { $set: { inicioHorario: hhmm, minutosPorConjunto: min } });
  rev(provaId);
}

/** Salva os intervalos da grade (pausa de N minutos após o conjunto X). */
export async function salvarIntervalos(provaId: string, intervalos: { aposOrdem: number; minutos: number }[]) {
  const prova = await dono(provaId);
  await conectar();
  const limpos = (intervalos || [])
    .map((i) => ({ aposOrdem: Math.max(1, Math.round(Number(i.aposOrdem) || 0)), minutos: Math.max(1, Math.min(240, Math.round(Number(i.minutos) || 0))) }))
    .filter((i) => i.aposOrdem >= 1)
    .sort((a, b) => a.aposOrdem - b.aposOrdem);
  await Prova.updateOne({ _id: prova._id }, { $set: { intervalos: limpos } });
  rev(provaId);
}
