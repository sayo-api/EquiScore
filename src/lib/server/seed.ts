import "server-only";
import { Admin, Reprise } from "./models";
import { gerarHash } from "./senha";
import catalogo from "@/data/reprises.json";

/** Semeia o catálogo oficial de reprises e o administrador inicial (idempotente). */
export async function semear() {
  for (const r of catalogo as { nome: string }[]) {
    await Reprise.updateOne({ nome: r.nome, ownerId: null }, { $set: { ...r, ownerId: null } }, { upsert: true });
  }
  const username = (process.env.ADMIN_USER || "admin").trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;
  if (senha && !(await Admin.exists({ username }))) {
    await Admin.create({ username, password: await gerarHash(senha), nome: username, role: "ADMIN" });
  }
}
