import type { Metadata } from "next";
import { MarcaHorizontal } from "@/components/marca";
import { conectar } from "@/lib/server/db";

export const metadata: Metadata = { title: "Resultados" };
// Lista viva: sempre busca no banco (resultados publicados mudam durante o evento).
export const dynamic = "force-dynamic";

interface Publicacao {
  _id: unknown;
  provaNome?: string;
  nome?: string;
  tipo?: string;
  local?: string;
  publicadoEm?: Date;
}

export default async function Resultados() {
  const db = (await conectar()).connection.db!;
  const pubs = await db
    .collection<Publicacao>("publicacaos")
    .find({}, { projection: { provaNome: 1, nome: 1, tipo: 1, local: 1, publicadoEm: 1 } })
    .sort({ publicadoEm: -1 })
    .limit(50)
    .toArray();

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-eqs-line">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <MarcaHorizontal />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-black">Resultados publicados</h1>
        <ul className="mt-6 divide-y divide-eqs-line overflow-hidden rounded-xl border border-eqs-line">
          {pubs.length === 0 && <li className="p-8 text-center text-neutral-400">Nenhum resultado publicado.</li>}
          {pubs.map((p) => (
            <li key={String(p._id)} className="flex flex-wrap items-center justify-between gap-2 bg-eqs-ink-2 px-4 py-3">
              <span className="font-semibold">{p.provaNome || p.nome || "Prova"}</span>
              <span className="text-sm text-neutral-400">
                {[p.tipo, p.publicadoEm && new Date(p.publicadoEm).toLocaleDateString("pt-BR")].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
