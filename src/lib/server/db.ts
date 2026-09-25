import "server-only";
import mongoose from "mongoose";

/**
 * Conexão única por instância (reaproveitada entre requisições na Vercel).
 * O EquiScore usa o MESMO banco do SAHDI: as coleções e campos são os mesmos,
 * então os dois sistemas podem rodar lado a lado durante a migração.
 */
const g = globalThis as unknown as { _eqsMongo?: Promise<typeof mongoose> };

export function conectar(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada.");
  g._eqsMongo ??= mongoose
    .connect(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
    .catch((err) => {
      g._eqsMongo = undefined; // próxima requisição tenta de novo
      throw err;
    });
  return g._eqsMongo;
}
