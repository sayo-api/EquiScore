"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Admin, Avaliacao, Cavaleiro, Prova, Publicacao, ResultadoSalto } from "@/lib/server/models";
import { gerarHash } from "@/lib/server/senha";
import { exigirSuper } from "@/lib/server/sessao";

export type EstadoUsuario = { erro?: string; ok?: string } | undefined;

const Novo = z.object({
  usuario: z.string().trim().toLowerCase().min(3, "Login deve ter ao menos 3 caracteres.").regex(/^[a-z0-9._-]+$/, "Use apenas letras, números, ponto, hífen ou underline."),
  nome: z.string().trim().max(80).optional(),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  role: z.enum(["ADMIN", "SUPER"]),
});

export async function criarUsuario(_: EstadoUsuario, form: FormData): Promise<EstadoUsuario> {
  await exigirSuper();
  const d = Novo.safeParse({
    usuario: form.get("usuario"),
    nome: form.get("nome") || undefined,
    senha: form.get("senha"),
    role: form.get("role") || "ADMIN",
  });
  if (!d.success) return { erro: d.error.issues[0].message };
  await conectar();
  if (await Admin.exists({ username: d.data.usuario })) return { erro: "Já existe um usuário com esse login." };
  await Admin.create({
    username: d.data.usuario,
    nome: d.data.nome || d.data.usuario,
    password: await gerarHash(d.data.senha),
    role: d.data.role,
  });
  revalidatePath("/painel/admin");
  return { ok: `Usuário "${d.data.usuario}" criado.` };
}

const Edicao = z.object({
  id: z.string().min(1),
  nome: z.string().trim().max(80).optional(),
  senha: z.string().optional(),
  role: z.enum(["ADMIN", "SUPER"]).optional(),
});

export async function editarUsuario(_: EstadoUsuario, form: FormData): Promise<EstadoUsuario> {
  const eu = await exigirSuper();
  const d = Edicao.safeParse({
    id: form.get("id"),
    nome: form.get("nome") || undefined,
    senha: form.get("senha") || undefined,
    role: form.get("role") || undefined,
  });
  if (!d.success || !Types.ObjectId.isValid(d.data.id)) return { erro: "Dados inválidos." };
  if (d.data.senha && d.data.senha.length < 6) return { erro: "A nova senha deve ter ao menos 6 caracteres." };
  await conectar();
  const update: Record<string, unknown> = {};
  if (d.data.nome !== undefined) update.nome = d.data.nome;
  if (d.data.senha) update.password = await gerarHash(d.data.senha);
  if (d.data.role) {
    // Impede o super remover o próprio privilégio e ficar sem administrador.
    if (String(eu.userId) === d.data.id && d.data.role !== "SUPER") return { erro: "Você não pode rebaixar o próprio acesso." };
    update.role = d.data.role;
  }
  const u = await Admin.findByIdAndUpdate(d.data.id, update, { new: true });
  if (!u) return { erro: "Usuário não encontrado." };
  revalidatePath("/painel/admin");
  return { ok: "Alterações salvas." };
}

export async function excluirUsuario(id: string): Promise<{ erro?: string; ok?: boolean }> {
  const eu = await exigirSuper();
  if (!Types.ObjectId.isValid(id)) return { erro: "Id inválido." };
  if (String(eu.userId) === id) return { erro: "Você não pode excluir o próprio usuário." };
  await conectar();
  const dono = new Types.ObjectId(id);
  await Promise.all([
    Avaliacao.deleteMany({ ownerId: dono }),
    Cavaleiro.deleteMany({ ownerId: dono }),
    Publicacao.deleteMany({ ownerId: dono }),
    ResultadoSalto.deleteMany({ ownerId: dono }),
    Prova.deleteMany({ ownerId: dono }),
  ]);
  await Admin.findByIdAndDelete(id);
  revalidatePath("/painel/admin");
  return { ok: true };
}
