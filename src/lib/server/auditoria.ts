import "server-only";
import { Auditoria } from "./models";

/** Registra uma entrada no histórico da prova (best-effort, nunca quebra a ação). */
export async function registrar(prova: Record<string, unknown>, autor: string, acao: string, resumo: string) {
  try {
    await Auditoria.create({ ownerId: prova.ownerId, provaId: prova._id, autor, acao, resumo });
  } catch { /* histórico é secundário */ }
}
