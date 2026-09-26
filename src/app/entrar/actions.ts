"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { conectar } from "@/lib/server/db";
import { Admin, Competidor, Juiz, Prova } from "@/lib/server/models";
import { conferirSenha } from "@/lib/server/senha";
import { ehAdminFixo, garantirAdminFixo } from "@/lib/server/admin-fixo";
import { criarSessao, criarSessaoJuiz, criarSessaoComp, encerrarSessao } from "@/lib/server/sessao";

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

  // Admin fixo: entra sempre, garantindo o registro no banco.
  if (ehAdminFixo(dados.data.usuario, dados.data.senha)) {
    const fixo = await garantirAdminFixo();
    await criarSessao({ userId: String(fixo._id), nome: fixo.nome || fixo.username || "", role: fixo.role || "ADMIN" });
    redirect("/painel");
  }

  // 1) Organizador / administrador
  const admin = await Admin.findOne({ username: dados.data.usuario }).lean();
  if (admin && (await conferirSenha(dados.data.senha, admin.password))) {
    await criarSessao({ userId: String(admin._id), nome: admin.nome || admin.username || "", role: admin.role || "ADMIN" });
    redirect("/painel");
  }

  // 2) Juiz — mesmo login do site; ao entrar vai direto ao painel do juiz.
  const juiz = await Juiz.findOne({ username: dados.data.usuario }).lean();
  if (juiz && (await conferirSenha(dados.data.senha, juiz.password))) {
    const prova = await Prova.findById(juiz.provaId).lean();
    if (!prova) return { erro: "A prova deste juiz não existe mais.", usuario };
    await criarSessaoJuiz({
      juizId: String(juiz._id),
      provaId: String(juiz.provaId),
      letra: String(juiz.juizLetra || "C"),
      nome: String(juiz.nome || "Juiz"),
    });
    redirect("/juiz");
  }

  // 3) Competidor (cavaleiro) — login por e-mail; vai para a área de inscrições.
  const comp = await Competidor.findOne({ email: dados.data.usuario }).lean();
  if (comp && (await conferirSenha(dados.data.senha, comp.password))) {
    await criarSessaoComp({ compId: String(comp._id), nome: String(comp.nome || ""), email: String(comp.email || "") });
    redirect("/competir");
  }

  // Mesma mensagem para usuário inexistente e senha errada: não revela quais logins existem.
  return { erro: "Usuário ou senha incorretos.", usuario };
}

export async function sair() {
  await encerrarSessao();
  redirect("/entrar");
}
