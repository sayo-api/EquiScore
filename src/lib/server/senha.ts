import "server-only";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (s: string, salt: string, len: number) => Promise<Buffer>;

/** Mesmo formato do SAHDI ("scrypt$salt$hash") — as senhas atuais continuam valendo. */
export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(senha, salt, 64);
  return `scrypt$${salt}$${hash.toString("hex")}`;
}

export async function conferirSenha(senha: string, guardada: string | null | undefined): Promise<boolean> {
  if (!guardada?.startsWith("scrypt$")) return false; // senha em texto puro não é aceita aqui
  const [, salt, hash] = guardada.split("$");
  const calc = await scryptAsync(senha, salt, 64);
  const esperado = Buffer.from(hash, "hex");
  return calc.length === esperado.length && timingSafeEqual(calc, esperado);
}
