"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Auditoria, Avaliacao, Cavaleiro, Juiz, Prova, Publicacao, Reprise, ResultadoSalto } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { registrar } from "@/lib/server/auditoria";

async function dono(provaId: string) {
  const s = await exigirSessao();
  const prova = await provaDoDono(provaId, s.userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return { prova, autor: s.nome || "" };
}

export type EstadoConfig = { erro?: string; ok?: string } | undefined;

const Base = z.object({
  nome: z.string().trim().min(1, "Informe o nome da prova."),
  local: z.string().trim().optional(),
  data: z.string().optional(),
});

export async function editarProva(provaId: string, _: EstadoConfig, form: FormData): Promise<EstadoConfig> {
  const { prova, autor } = await dono(provaId);
  const p = Base.safeParse({ nome: form.get("nome"), local: form.get("local"), data: form.get("data") });
  if (!p.success) return { erro: p.error.issues[0].message };
  await conectar();
  const update: Record<string, unknown> = {
    nome: p.data.nome, local: p.data.local || "", data: p.data.data ? new Date(p.data.data) : null,
  };
  if (prova.tipo === "ADESTRAMENTO") {
    const reprises = form.getAll("reprises").map(String).filter(Boolean);
    if (!reprises.length) return { erro: "Selecione ao menos uma reprise." };
    const validas = await Reprise.find({ _id: { $in: reprises } }, { _id: 1 }).lean();
    update.reprises = validas.map((r) => r._id);
    update.numJuizes = Math.max(1, Math.min(5, Number(form.get("numJuizes")) || 1));
  } else {
    update.baremo = String(form.get("baremo") || "220.2.1.1");
    update.tempoConcedido = Math.max(1, Number(form.get("tempoConcedido")) || 80);
    const ti = Number(form.get("tempoIdeal"));
    update.tempoIdeal = ti > 0 ? ti : null;
  }
  await Prova.updateOne({ _id: prova._id }, { $set: update });
  await registrar(prova, autor, "Prova editada", p.data.nome);
  revalidatePath(`/painel/provas/${provaId}`, "layout");
  return { ok: "Alterações salvas." };
}

export async function alternarStatus(provaId: string) {
  const { prova, autor } = await dono(provaId);
  await conectar();
  const novo = prova.status === "ATIVA" ? "ENCERRADA" : "ATIVA";
  await Prova.updateOne({ _id: prova._id }, { $set: { status: novo } });
  await registrar(prova, autor, novo === "ATIVA" ? "Inscrições reabertas" : "Prova encerrada", "");
  revalidatePath(`/painel/provas/${provaId}`, "layout");
}

export async function excluirProva(provaId: string): Promise<{ erro?: string }> {
  const { prova } = await dono(provaId);
  await conectar();
  const id = prova._id;
  await Promise.all([
    Avaliacao.deleteMany({ provaId: id }),
    Cavaleiro.deleteMany({ provaId: id }),
    ResultadoSalto.deleteMany({ provaId: id }),
    Publicacao.deleteMany({ provaId: id }),
    Juiz.deleteMany({ provaId: id }),
    Auditoria.deleteMany({ provaId: id }),
  ]);
  await Prova.deleteOne({ _id: id });
  redirect("/painel");
}
