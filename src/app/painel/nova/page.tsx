import type { Metadata } from "next";
import { conectar } from "@/lib/server/db";
import { Reprise } from "@/lib/server/models";
import { exigirSessao } from "@/lib/server/sessao";
import { BAREMOS } from "@/lib/domain/salto";
import { FormNovaProva } from "./form";

export const metadata: Metadata = { title: "Nova prova" };

export default async function NovaProva() {
  await exigirSessao();
  await conectar();
  const reprises = await Reprise.find({ ownerId: null }, { nome: 1 }).lean();
  const lista = reprises.map((r) => ({ id: String(r._id), nome: String(r.nome) }));
  return (
    <div className="mx-auto max-w-2xl eqs-in">
      <h1 className="text-3xl font-black tracking-tight">Nova prova</h1>
      <FormNovaProva reprises={lista} baremos={BAREMOS.map((b) => ({ id: b.id, nome: b.nome, desc: b.desc }))} />
    </div>
  );
}
