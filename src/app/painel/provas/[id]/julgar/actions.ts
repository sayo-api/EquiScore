"use server";
import { revalidatePath } from "next/cache";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, ResultadoSalto } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { baremoPorId, calcularPercurso } from "@/lib/domain/salto";

async function dono(provaId: string) {
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(provaId, userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return prova;
}
const letras = (n: number) => ["C", "B", "E", "H", "M"].slice(0, Math.max(1, Math.min(5, n)));

type Nota = { num: number; nota: number };
export async function salvarAvaliacao(provaId: string, cavId: string, letra: string, dados: {
  notasPista: Nota[]; notasConjunto: Nota[]; erros: number; finalizar: boolean;
}) {
  const prova = await dono(provaId);
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId: prova._id }).lean<Record<string, unknown>>();
  if (!cav) throw new Error("Competidor não encontrado.");
  const status = dados.erros >= 3 ? "ELIMINADO" : dados.finalizar ? "FINALIZADO" : "EM_ANDAMENTO";
  await Avaliacao.updateOne(
    { cavaleiroId: cav._id, repriseId: cav.repriseId, juizLetra: letra },
    { $set: { provaId: prova._id, ownerId: prova.ownerId, notasPista: dados.notasPista, notasConjunto: dados.notasConjunto, errosPercurso: dados.erros, status } },
    { upsert: true },
  );
  // Status do conjunto: eliminado se algum juiz eliminou; finalizado se todos os juízes esperados finalizaram.
  const avals = await Avaliacao.find({ cavaleiroId: cav._id, repriseId: cav.repriseId }).lean<Record<string, unknown>[]>();
  const esperados = letras(Number(prova.numJuizes || 1)).length;
  let novo = "AGUARDANDO";
  if (avals.some((a) => a.status === "ELIMINADO")) novo = "ELIMINADO";
  else if (avals.length >= esperados && avals.every((a) => a.status === "FINALIZADO")) novo = "FINALIZADO";
  else if (avals.some((a) => a.status === "FINALIZADO" || a.status === "EM_ANDAMENTO")) novo = "EM_ANDAMENTO";
  await Cavaleiro.updateOne({ _id: cav._id }, { $set: { status: novo } });
  revalidatePath(`/painel/provas/${provaId}/julgar`);
}

export async function salvarSalto(provaId: string, cavId: string, dados: {
  tempoMs: number; derrubadas: number; recuos: number; quedaCavalo: boolean; forfait: boolean; finalizar: boolean;
}) {
  const prova = await dono(provaId);
  await conectar();
  const cav = await Cavaleiro.findOne({ _id: cavId, provaId: prova._id }).lean<Record<string, unknown>>();
  if (!cav) throw new Error("Competidor não encontrado.");
  const tipo = baremoPorId(String(prova.baremo || "220.2.1.1"))?.tipo ?? "tempo_concedido";
  const r = calcularPercurso({
    tipo, tempoMs: dados.tempoMs, tempoConcedido: Number(prova.tempoConcedido || 80),
    tempoIdeal: prova.tempoIdeal != null ? Number(prova.tempoIdeal) : null,
    derrubadas: dados.derrubadas, recuos: dados.recuos, quedaCavalo: dados.quedaCavalo, forfait: dados.forfait,
  });
  await ResultadoSalto.updateOne(
    { cavaleiroId: cav._id },
    { $set: {
      provaId: prova._id, ownerId: prova.ownerId, tempoMs: dados.tempoMs, derrubadas: dados.derrubadas, recuos: dados.recuos,
      quedaCavalo: dados.quedaCavalo, forfait: dados.forfait, penalidadesFaltas: r.penalidadesFaltas, penalidadesTempo: r.penalidadesTempo,
      penalidadesTotais: r.penalidadesTotais, diferencaIdeal: r.diferencaIdeal, status: r.status, motivoEliminacao: r.motivoEliminacao,
    } },
    { upsert: true },
  );
  const novo = !dados.finalizar ? "EM_ANDAMENTO" : r.status === "eliminado" ? "ELIMINADO" : "FINALIZADO";
  await Cavaleiro.updateOne({ _id: cav._id }, { $set: { status: novo } });
  revalidatePath(`/painel/provas/${provaId}/julgar`);
}
export const letrasDeJuiz = async (n: number) => letras(n);
