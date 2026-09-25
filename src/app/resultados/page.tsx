import type { Metadata } from "next";
import Link from "next/link";
import { MarcaHorizontal } from "@/components/marca";
import { conectar } from "@/lib/server/db";
import { Publicacao } from "@/lib/server/models";

export const metadata: Metadata = { title: "Resultados" };
export const dynamic = "force-dynamic";

export default async function Resultados() {
  await conectar();
  const pubs = await Publicacao.find({}, { provaNome: 1, tipo: 1, local: 1, publicadoEm: 1 }).sort({ publicadoEm: -1 }).limit(50).lean();
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line"><div className="mx-auto max-w-3xl px-4 py-3"><MarcaHorizontal /></div></header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-black">Resultados publicados</h1>
        <ul className="mt-5 overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
          {pubs.length === 0 && <li className="p-8 text-center text-mut">Nenhum resultado publicado.</li>}
          {pubs.map((p) => (
            <li key={String(p._id)}>
              <Link href={`/r/${p.provaId}`} className="flex items-center justify-between gap-3 border-t border-line2 px-4 py-3 hover:bg-surf2 first:border-0">
                <span className="font-semibold">{String(p.provaNome || "Prova")}</span>
                <span className="text-sm text-mut">{[p.tipo, p.publicadoEm ? new Date(p.publicadoEm as Date).toLocaleDateString("pt-BR") : ""].filter(Boolean).join(" · ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
