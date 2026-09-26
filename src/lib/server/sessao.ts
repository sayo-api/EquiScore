import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

/*
 * Sessão em cookie httpOnly assinado (JWT HS256). Diferente do SAHDI, o token
 * não fica no localStorage: um script injetado na página não consegue lê-lo.
 */
export const COOKIE_SESSAO = "eqs_sessao";
export const COOKIE_JUIZ = "eqs_juiz";
export const COOKIE_COMP = "eqs_comp";
const DURACAO_H = 24;

export interface Sessao {
  userId: string;
  nome: string;
  role: string;
}

export interface SessaoJuiz {
  juizId: string;
  provaId: string;
  letra: string;
  nome: string;
}

export interface SessaoComp {
  compId: string;
  nome: string;
  email: string;
}

function chave() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET ausente ou curta (mín. 32 caracteres).");
  return new TextEncoder().encode(s);
}

export async function criarSessao(dados: Sessao) {
  const expira = new Date(Date.now() + DURACAO_H * 3600_000);
  const token = await new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(chave());
  (await cookies()).set(COOKIE_SESSAO, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function lerSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    return { userId: String(payload.userId), nome: String(payload.nome), role: String(payload.role) };
  } catch {
    return null;
  }
}

export async function encerrarSessao() {
  (await cookies()).delete(COOKIE_SESSAO);
}

/** Para páginas e ações protegidas: devolve a sessão ou manda para o login. */
export const exigirSessao = cache(async (): Promise<Sessao> => {
  const s = await lerSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!s) redirect("/entrar");
  return s;
});

/** Exige o papel SUPER (administrador). Caso contrário, volta ao painel. */
export const exigirSuper = cache(async (): Promise<Sessao> => {
  const s = await exigirSessao();
  if (s.role !== "SUPER") redirect("/painel");
  return s;
});


// ── Sessão do JUIZ (cookie separado do organizador) ───────────
export async function criarSessaoJuiz(dados: SessaoJuiz) {
  const expira = new Date(Date.now() + DURACAO_H * 3600_000);
  const token = await new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(chave());
  (await cookies()).set(COOKIE_JUIZ, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function lerSessaoJuiz(token: string | undefined): Promise<SessaoJuiz | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    if (!payload.juizId) return null;
    return { juizId: String(payload.juizId), provaId: String(payload.provaId), letra: String(payload.letra), nome: String(payload.nome) };
  } catch {
    return null;
  }
}

export async function encerrarSessaoJuiz() {
  (await cookies()).delete(COOKIE_JUIZ);
}

/** Para páginas e ações do juiz: devolve a sessão ou manda para o login. */
export const exigirJuiz = cache(async (): Promise<SessaoJuiz> => {
  const s = await lerSessaoJuiz((await cookies()).get(COOKIE_JUIZ)?.value);
  if (!s) redirect("/entrar");
  return s;
});


// ── Sessão do COMPETIDOR (cavaleiro) ─────────────────────────
export async function criarSessaoComp(dados: SessaoComp) {
  const expira = new Date(Date.now() + DURACAO_H * 3600_000);
  const token = await new SignJWT({ ...dados })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expira)
    .sign(chave());
  (await cookies()).set(COOKIE_COMP, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expira,
  });
}

export async function lerSessaoComp(token: string | undefined): Promise<SessaoComp | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    if (!payload.compId) return null;
    return { compId: String(payload.compId), nome: String(payload.nome), email: String(payload.email) };
  } catch {
    return null;
  }
}

export async function encerrarSessaoComp() {
  (await cookies()).delete(COOKIE_COMP);
}

/** Para páginas e ações do competidor: devolve a sessão ou manda para o login. */
export const exigirComp = cache(async (): Promise<SessaoComp> => {
  const s = await lerSessaoComp((await cookies()).get(COOKIE_COMP)?.value);
  if (!s) redirect("/competir/entrar");
  return s;
});
