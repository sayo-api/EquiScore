"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Competidor, Prova } from "@/lib/server/models";
import { gerarHash, conferirSenha } from "@/lib/server/senha";
import { criarSessaoComp, encerrarSessaoComp, exigirComp } from "@/lib/server/sessao";
import { camposDoForm } from "@/lib/server/cadastro";

export type EstadoComp = { erro?: string; ok?: string } | undefined;

const Cadastro = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  nome: z.string().trim().min(2, "Informe seu nome completo."),
  nomeGuerra: z.string().trim().min(2, "Informe seu nome de guerra."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  postoGraduacao: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
});

export async function cadastrarComp(_: EstadoComp, form: FormData): Promise<EstadoComp> {
  const d = Cadastro.safeParse({
    email: form.get("email"), nome: form.get("nome"), nomeGuerra: form.get("nomeGuerra"), senha: form.get("senha"),
    postoGraduacao: form.get("postoGraduacao") || undefined, telefone: form.get("telefone") || undefined,
  });
  if (!d.success) return { erro: d.error.issues[0].message };
  await conectar();
  if (await Competidor.exists({ email: d.data.email })) return { erro: "Já existe uma conta com esse e-mail." };
  const c = await Competidor.create({
    email: d.data.email, nome: d.data.nome, nomeGuerra: d.data.nomeGuerra, password: await gerarHash(d.data.senha),
    postoGraduacao: d.data.postoGraduacao || "", telefone: d.data.telefone || "",
  });
  await criarSessaoComp({ compId: String(c._id), nome: c.nome || "", email: c.email || "" });
  redirect("/competir");
}

export async function entrarComp(_: EstadoComp, form: FormData): Promise<EstadoComp> {
  const email = String(form.get("email") || "").trim().toLowerCase();
  const senha = String(form.get("senha") || "");
  if (!email || !senha) return { erro: "Informe e-mail e senha." };
  await conectar();
  const c = await Competidor.findOne({ email }).lean<Record<string, unknown>>();
  if (!c || !(await conferirSenha(senha, c.password as string))) return { erro: "E-mail ou senha incorretos." };
  await criarSessaoComp({ compId: String(c._id), nome: String(c.nome || ""), email: String(c.email || "") });
  redirect("/competir");
}

export async function sairComp() {
  await encerrarSessaoComp();
  redirect("/competir/entrar");
}

export async function registrarNaProva(provaId: string, form: FormData): Promise<{ erro?: string; ok?: boolean }> {
  const sess = await exigirComp();
  if (!Types.ObjectId.isValid(provaId)) return { erro: "Prova inválida." };
  await conectar();
  const prova = await Prova.findById(provaId).lean<Record<string, unknown>>();
  if (!prova || prova.status !== "ATIVA") return { erro: "As inscrições desta prova estão encerradas." };
  const campos = camposDoForm(form);
  if (!campos.cavalo) return { erro: "Informe o nome do cavalo." };
  const perfil = await Competidor.findById(sess.compId).lean<Record<string, unknown>>();
  const nomeExibido = String(perfil?.nomeGuerra || perfil?.nome || sess.nome || "").trim();
  if (!nomeExibido) return { erro: "Complete seu perfil (nome de guerra) antes de se inscrever." };
  const repriseId = prova.tipo === "ADESTRAMENTO" ? String(form.get("repriseId") || "") : "";
  const categoria = prova.tipo === "SALTO" ? String(form.get("altura") || form.get("categoria") || "").trim() : campos.categoria;
  if (prova.tipo === "ADESTRAMENTO" && !(prova.reprises as Types.ObjectId[]).map(String).includes(repriseId))
    return { erro: "Selecione a reprise." };

  // Evita inscrição duplicada do mesmo competidor na mesma reprise/prova.
  const jaTem = await Cavaleiro.findOne({
    provaId: prova._id, competidorId: new Types.ObjectId(sess.compId),
    ...(prova.tipo === "ADESTRAMENTO" ? { repriseId: new Types.ObjectId(repriseId) } : {}),
    cavalo: campos.cavalo,
  }).lean();
  if (jaTem) return { erro: "Você já se inscreveu nesta reprise com esse cavalo." };

  await Cavaleiro.create({
    ...campos, categoria,
    nome: nomeExibido, nomeCompleto: String(perfil?.nome || ""),
    postoGraduacao: String(perfil?.postoGraduacao || campos.postoGraduacao || ""),
    telefone: String(perfil?.telefone || ""), email: String(perfil?.email || sess.email || ""),
    provaId: prova._id, ownerId: prova.ownerId, competidorId: new Types.ObjectId(sess.compId),
    repriseId: repriseId ? new Types.ObjectId(repriseId) : null,
    ordemEntrada: 0, status: "PENDENTE",
  });
  revalidatePath("/competir");
  return { ok: true };
}

export async function atualizarPerfil(_: EstadoComp, form: FormData): Promise<EstadoComp> {
  const sess = await exigirComp();
  const nome = String(form.get("nome") || "").trim();
  const senha = String(form.get("senha") || "");
  if (nome.length < 2) return { erro: "Informe seu nome." };
  if (senha && senha.length < 6) return { erro: "A nova senha deve ter ao menos 6 caracteres." };
  await conectar();
  const nomeGuerra = String(form.get("nomeGuerra") || "").trim();
  if (nomeGuerra.length < 2) return { erro: "Informe seu nome de guerra." };
  const update: Record<string, unknown> = {
    nome, nomeGuerra, postoGraduacao: String(form.get("postoGraduacao") || "").trim(), telefone: String(form.get("telefone") || "").trim(),
  };
  if (senha) update.password = await gerarHash(senha);
  await Competidor.updateOne({ _id: sess.compId }, { $set: update });
  await criarSessaoComp({ compId: sess.compId, nome, email: sess.email });
  revalidatePath("/competir");
  return { ok: "Perfil atualizado." };
}

export async function cancelarInscricao(cavId: string): Promise<{ ok?: boolean }> {
  const sess = await exigirComp();
  if (!Types.ObjectId.isValid(cavId)) return {};
  await conectar();
  // Só pode cancelar a própria inscrição e enquanto pendente.
  await Cavaleiro.deleteOne({ _id: cavId, competidorId: new Types.ObjectId(sess.compId), status: "PENDENTE" });
  revalidatePath("/competir");
  return { ok: true };
}
