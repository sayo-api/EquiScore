"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Juiz, Prova } from "@/lib/server/models";
import { conferirSenha } from "@/lib/server/senha";
import { criarSessaoJuiz, encerrarSessaoJuiz, exigirJuiz } from "@/lib/server/sessao";

const Credenciais = z.object({
  usuario: z.string().trim().toLowerCase().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
});
export type EstadoLoginJuiz = { erro?: string; usuario?: string } | undefined;

export async function entrarJuiz(_: EstadoLoginJuiz, form: FormData): Promise<EstadoLoginJuiz> {
  const d = Credenciais.safeParse({ usuario: form.get("usuario"), senha: form.get("senha") });
  const usuario = String(form.get("usuario") ?? "");
  if (!d.success) return { erro: d.error.issues[0].message, usuario };
  await conectar();
  const juiz = await Juiz.findOne({ username: d.data.usuario }).lean<Record<string, unknown>>();
  if (!juiz || !(await conferirSenha(d.data.senha, juiz.password as string))) {
    return { erro: "Usuário ou senha incorretos.", usuario };
  }
  const prova = await Prova.findById(juiz.provaId).lean<Record<string, unknown>>();
  if (!prova) return { erro: "A prova deste juiz não existe mais.", usuario };
  await criarSessaoJuiz({
    juizId: String(juiz._id),
    provaId: String(juiz.provaId),
    letra: String(juiz.juizLetra || "C"),
    nome: String(juiz.nome || "Juiz"),
  });
  redirect("/juiz");
}

export async function sairJuiz() {
  await encerrarSessaoJuiz();
  redirect("/juiz/entrar");
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
