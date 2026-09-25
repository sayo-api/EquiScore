import "server-only";
import mongoose from "mongoose";
import { Meta } from "./models";
import { semear } from "./seed";

const g = globalThis as unknown as { _eqs?: Promise<typeof mongoose> };
const VERSAO = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || "dev";

async function pos() {
  // Semeia uma vez por versão publicada (não a cada cold start).
  const feito = await Meta.findById("seed").lean();
  if (feito && (feito as { versao?: string }).versao === VERSAO && VERSAO !== "dev") return;
  await semear();
  await Meta.updateOne({ _id: "seed" }, { $set: { versao: VERSAO, em: new Date() } }, { upsert: true });
}

export function conectar(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI não configurada.");
  g._eqs ??= mongoose
    .connect(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 })
    .then(async (m) => {
      await pos();
      return m;
    })
    .catch((err) => {
      g._eqs = undefined;
      throw err;
    });
  return g._eqs;
}
