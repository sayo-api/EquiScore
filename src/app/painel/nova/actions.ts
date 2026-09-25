"use server";
import { redirect } from "next/navigation";
import { Types } from "mongoose";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Prova, Reprise } from "@/lib/server/models";
import { exigirSessao } from "@/lib/server/sessao";

const Base = z.object({
  nome: z.string().trim().min(1, "Informe o nome da prova."),
  local: z.string().trim().optional(),
  data: z.string().optional(),
  tipo: z.enum(["ADESTRAMENTO", "SALTO"]),
});

export type EstadoNova = { erro?: string } | undefined;

export async function criarProva(_: EstadoNova, form: FormData): Promise<EstadoNova> {
  const { userId } = await exigirSessao();
  const p = Base.safeParse({ nome: form.get("nome"), local: form.get("local"), data: form.get("data"), tipo: form.get("tipo") });
  if (!p.success) return { erro: p.error.issues[0].message };
  await conectar();
  const dono = new Types.ObjectId(userId);
  const doc: Record<string, unknown> = {
    nome: p.data.nome, local: p.data.local || "", data: p.data.data ? new Date(p.data.data) : null,
    tipo: p.data.tipo, ownerId: dono, status: "ATIVA",
  };
  if (p.data.tipo === "ADESTRAMENTO") {
    const reprises = form.getAll("reprises").map(String).filter(Boolean);
    if (!reprises.length) return { erro: "Selecione ao menos uma reprise." };
    const validas = await Reprise.find({ _id: { $in: reprises } }, { _id: 1 }).lean();
    doc.reprises = validas.map((r) => r._id);
    doc.numJuizes = Math.max(1, Math.min(5, Number(form.get("numJuizes")) || 1));
  } else {
    doc.baremo = String(form.get("baremo") || "220.2.1.1");
    doc.tempoConcedido = Math.max(1, Number(form.get("tempoConcedido")) || 80);
    const ti = Number(form.get("tempoIdeal"));
    doc.tempoIdeal = ti > 0 ? ti : null;
  }
  const nova = await Prova.create(doc);
  redirect(`/painel/provas/${nova._id}`);
}
