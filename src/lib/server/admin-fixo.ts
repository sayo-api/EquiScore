import "server-only";
import { Admin } from "./models";
import { gerarHash } from "./senha";

/**
 * Admin fixo do sistema. Sempre permite entrar com estas credenciais, mesmo
 * que o seed nunca tenha rodado. Podem ser sobrescritas por ADMIN_USER /
 * ADMIN_PASSWORD; o padrão é o login combinado com o organizador.
 */
export const ADMIN_FIXO = {
  usuario: (process.env.ADMIN_USER || "sayoz").trim().toLowerCase(),
  senha: process.env.ADMIN_PASSWORD || "34615194",
};

/** true quando as credenciais informadas são as do admin fixo. */
export function ehAdminFixo(usuario: string, senha: string): boolean {
  return usuario.trim().toLowerCase() === ADMIN_FIXO.usuario && senha === ADMIN_FIXO.senha;
}

/**
 * Garante o registro do admin fixo no banco (cria se não existir) e devolve o
 * documento — para a sessão usar o _id real e o ownerId das provas ser válido.
 */
export async function garantirAdminFixo() {
  const doc = await Admin.findOneAndUpdate(
    { username: ADMIN_FIXO.usuario },
    {
      $set: { role: "SUPER" }, // o admin fixo é sempre o super-administrador
      $setOnInsert: { username: ADMIN_FIXO.usuario, password: await gerarHash(ADMIN_FIXO.senha), nome: ADMIN_FIXO.usuario },
    },
    { upsert: true, new: true },
  );
  return doc!;
}
