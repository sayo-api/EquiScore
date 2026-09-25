"use server";
import { revalidatePath } from "next/cache";
import { conectar } from "@/lib/server/db";
import { Prova, Publicacao } from "@/lib/server/models";
import { montarResultados, provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { gerarPdfResultados } from "@/lib/server/pdf";
import { enviarPdf } from "@/lib/server/r2";

export async function publicar(provaId: string): Promise<{ erro?: string; pdfUrl?: string | null }> {
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(provaId, userId);
  if (!prova) return { erro: "Prova não encontrada." };
  await conectar();
  const grupos = await montarResultados(prova);
  let pdfUrl: string | null = null;
  try {
    const pdf = await gerarPdfResultados({ provaNome: String(prova.nome), local: String(prova.local || ""), data: prova.data as Date, grupos });
    pdfUrl = await enviarPdf(`resultados/${provaId}-${Date.now()}.pdf`, pdf);
  } catch (e) {
    console.error("PDF/R2:", e);
  }
  await Publicacao.updateOne(
    { provaId: prova._id },
    { $set: { ownerId: prova.ownerId, tipo: prova.tipo, provaNome: prova.nome, local: prova.local, data: prova.data, publicadoEm: new Date(), grupos, pdfUrl } },
    { upsert: true },
  );
  await Prova.updateOne({ _id: prova._id }, { $set: { publicadoEm: new Date() } });
  revalidatePath(`/painel/provas/${provaId}/resultados`);
  return { pdfUrl };
}

export async function despublicar(provaId: string) {
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(provaId, userId);
  if (!prova) return;
  await conectar();
  await Publicacao.deleteOne({ provaId: prova._id });
  await Prova.updateOne({ _id: prova._id }, { $set: { publicadoEm: null } });
  revalidatePath(`/painel/provas/${provaId}/resultados`);
}
