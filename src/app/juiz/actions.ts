"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Prova } from "@/lib/server/models";
import { encerrarSessaoJuiz, exigirJuiz } from "@/lib/server/sessao";

export async function sairJuiz() {
  await encerrarSessaoJuiz();
  redirect("/entrar");
}

type Nota = { num: number; nota: number };
export async function salvarNotaJuiz(cavId: string, dados: {
  notasPista: Nota[]; notasConjunto: Nota[]; erros: number; finalizar: boolean;
}) {
  const j = await exigirJuiz();
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId: j.provaId }).lean<Record<string, unknown>>();
  if (!cav) throw new Error("Competidor não encontrado.");
  const status = dados.erros >= 3 ? "ELIMINADO" : dados.finalizar ? "FINALIZADO" : "EM_ANDAMENTO";
  await Avaliacao.updateOne(
    { cavaleiroId: cav._id, repriseId: cav.repriseId, juizLetra: j.letra },
    { $set: { provaId: cav.provaId, ownerId: cav.ownerId, juizNome: j.nome, notasPista: dados.notasPista, notasConjunto: dados.notasConjunto, errosPercurso: dados.erros, status } },
    { upsert: true },
  );
  // Consolida o status do conjunto (idêntico ao painel do organizador).
  const prova = await Prova.findById(j.provaId).lean<Record<string, unknown>>();
  const esperados = Math.max(1, Math.min(5, Number(prova?.numJuizes || 1)));
  const avals = await Avaliacao.find({ cavaleiroId: cav._id, repriseId: cav.repriseId }).lean<Record<string, unknown>[]>();
  let novo = "AGUARDANDO";
  if (avals.some((a) => a.status === "ELIMINADO")) novo = "ELIMINADO";
  else if (avals.length >= esperados && avals.every((a) => a.status === "FINALIZADO")) novo = "FINALIZADO";
  else if (avals.some((a) => a.status === "FINALIZADO" || a.status === "EM_ANDAMENTO")) novo = "EM_ANDAMENTO";
  await Cavaleiro.updateOne({ _id: cav._id }, { $set: { status: novo } });
  revalidatePath(`/juiz/reprise/${String(cav.repriseId)}`);
}
