"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Admin } from "@/lib/server/models";
import { conferirSenha } from "@/lib/server/senha";
import { criarSessao, encerrarSessao } from "@/lib/server/sessao";

const Credenciais = z.object({
  usuario: z.string().trim().toLowerCase().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
});

// "usuario" volta para o formulário: o React limpa os campos após cada envio.
export type EstadoLogin = { erro?: string; usuario?: string } | undefined;

export async function entrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const dados = Credenciais.safeParse({ usuario: form.get("usuario"), senha: form.get("senha") });
  const usuario = String(form.get("usuario") ?? "");
  if (!dados.success) return { erro: dados.error.issues[0].message, usuario };

  await conectar();
  const admin = await Admin.findOne({ username: dados.data.usuario }).lean();
  // Mesma mensagem para usuário inexistente e senha errada: não revela quais logins existem.
  if (!admin || !(await conferirSenha(dados.data.senha, admin.password))) {
    return { erro: "Usuário ou senha incorretos.", usuario };
  }
  await criarSessao({ userId: String(admin._id), nome: admin.nome || admin.username || "", role: admin.role || "ADMIN" });
  redirect("/painel");
}

export async function sair() {
  await encerrarSessao();
  redirect("/entrar");
}
