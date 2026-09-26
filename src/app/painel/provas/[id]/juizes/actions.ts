"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Juiz } from "@/lib/server/models";
import { gerarHash } from "@/lib/server/senha";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { registrar } from "@/lib/server/auditoria";

export type EstadoJuiz = { erro?: string; ok?: string } | undefined;

async function dono(provaId: string) {
  const s = await exigirSessao();
  const prova = await provaDoDono(provaId, s.userId);
  if (!prova) throw new Error("Prova não encontrada.");
  return { prova, userId: s.userId, autor: s.nome || "" };
}

const Novo = z.object({
  usuario: z.string().trim().toLowerCase().min(3, "Login deve ter ao menos 3 caracteres.").regex(/^[a-z0-9._-]+$/, "Use letras, números, ponto, hífen ou underline."),
  nome: z.string().trim().max(80).optional(),
  letra: z.string().trim().toUpperCase().regex(/^[A-Z]$/, "A letra do juiz deve ser uma letra (C, B, E, H, M)."),
  senha: z.string().min(4, "A senha deve ter ao menos 4 caracteres."),
});

export async function criarJuiz(provaId: string, _: EstadoJuiz, form: FormData): Promise<EstadoJuiz> {
  const { prova, userId, autor } = await dono(provaId);
  const d = Novo.safeParse({
    usuario: form.get("usuario"),
    nome: form.get("nome") || undefined,
    letra: form.get("letra"),
    senha: form.get("senha"),
  });
  if (!d.success) return { erro: d.error.issues[0].message };
  await conectar();
  if (await Juiz.exists({ username: d.data.usuario })) return { erro: "Já existe um juiz com esse login." };
  if (await Juiz.exists({ provaId: prova._id, juizLetra: d.data.letra })) return { erro: `Já existe um juiz na letra ${d.data.letra} nesta prova.` };
  await Juiz.create({
    username: d.data.usuario,
    nome: d.data.nome || `Juiz ${d.data.letra}`,
    juizLetra: d.data.letra,
    password: await gerarHash(d.data.senha),
    provaId: prova._id,
    ownerId: new Types.ObjectId(userId),
  });
  await registrar(prova, autor, "Juiz criado", `${d.data.usuario} (letra ${d.data.letra})`);
  revalidatePath(`/painel/provas/${provaId}/juizes`);
  return { ok: `Juiz "${d.data.usuario}" (letra ${d.data.letra}) criado.` };
}

const Edicao = z.object({
  id: z.string().min(1),
  nome: z.string().trim().max(80).optional(),
  letra: z.string().trim().toUpperCase().regex(/^[A-Z]$/).optional(),
  senha: z.string().optional(),
});

export async function editarJuiz(provaId: string, _: EstadoJuiz, form: FormData): Promise<EstadoJuiz> {
  const { prova } = await dono(provaId);
  const d = Edicao.safeParse({
    id: form.get("id"),
    nome: form.get("nome") || undefined,
    letra: form.get("letra") || undefined,
    senha: form.get("senha") || undefined,
  });
  if (!d.success || !Types.ObjectId.isValid(d.data.id)) return { erro: "Dados inválidos." };
  if (d.data.senha && d.data.senha.length < 4) return { erro: "A nova senha deve ter ao menos 4 caracteres." };
  await conectar();
  const j = await Juiz.findOne({ _id: d.data.id, provaId: prova._id });
  if (!j) return { erro: "Juiz não encontrado." };
  if (d.data.letra && d.data.letra !== j.juizLetra) {
    if (await Juiz.exists({ provaId: prova._id, juizLetra: d.data.letra, _id: { $ne: j._id } })) return { erro: `Já existe um juiz na letra ${d.data.letra}.` };
    j.juizLetra = d.data.letra;
  }
  if (d.data.nome !== undefined) j.nome = d.data.nome;
  if (d.data.senha) j.password = await gerarHash(d.data.senha);
  await j.save();
  revalidatePath(`/painel/provas/${provaId}/juizes`);
  return { ok: "Alterações salvas." };
}

export async function excluirJuiz(provaId: string, id: string): Promise<{ erro?: string; ok?: boolean }> {
  const { prova, autor } = await dono(provaId);
  if (!Types.ObjectId.isValid(id)) return { erro: "Id inválido." };
  await conectar();
  const j = await Juiz.findOne({ _id: id, provaId: prova._id }).lean<{ username?: string }>();
  await Juiz.deleteOne({ _id: id, provaId: prova._id });
  await registrar(prova, autor, "Juiz excluído", j?.username || id);
  revalidatePath(`/painel/provas/${provaId}/juizes`);
  return { ok: true };
}
