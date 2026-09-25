import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidObjectId, Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova, Reprise } from "@/lib/server/models";
import { exigirSessao } from "@/lib/server/sessao";

export default async function ProvaDetalhe({ params }: PageProps<"/painel/provas/[id]">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  if (!isValidObjectId(id)) notFound();
  await conectar();

  // Só o dono vê a prova (mesma regra de isolamento do SAHDI).
  const prova = await Prova.findOne({ _id: id, ownerId: new Types.ObjectId(userId) }).lean();
  if (!prova) notFound();

  const [competidores, reprises] = await Promise.all([
    Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean(),
    Reprise.find({ _id: { $in: prova.reprises ?? [] } }, { nome: 1 }).lean(),
  ]);
  const nomeReprise = new Map(reprises.map((r) => [String(r._id), r.nome ?? "—"]));
  const grupos = (prova.reprises ?? []).map((rid) => ({
    nome: nomeReprise.get(String(rid)) ?? "—",
    itens: competidores.filter((c) => String(c.repriseId) === String(rid)),
  }));

  return (
    <>
      <Link href="/painel" className="text-sm text-neutral-400 hover:text-white">
        ← Provas
      </Link>
      <h1 className="mt-2 text-3xl font-black">{prova.nome}</h1>
      <p className="mt-1 text-sm text-neutral-400">
        {competidores.length} competidor(es) · {grupos.length} reprise(s)
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {grupos.map((g) => (
          <section key={g.nome} className="overflow-hidden rounded-xl border border-eqs-line">
            <h2 className="bg-eqs-red-800/60 px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-red-100">
              {g.nome}
            </h2>
            {g.itens.length === 0 ? (
              <p className="px-4 py-4 text-sm text-neutral-500">Sem competidores.</p>
            ) : (
              <ol className="divide-y divide-eqs-line">
                {g.itens.map((c) => (
                  <li key={String(c._id)} className="flex items-center gap-4 bg-eqs-ink-2 px-4 py-3">
                    <span className="w-8 shrink-0 text-center font-mono text-sm font-bold text-eqs-red">
                      {c.ordemEntrada || "—"}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold">
                        {c.postoGraduacao} {c.nome}
                      </span>
                      <span className="block text-sm text-neutral-400">{c.cavalo}</span>
                    </span>
                    <span className="text-xs font-semibold text-neutral-400">{c.status}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
