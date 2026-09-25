import type { Metadata } from "next";
import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova } from "@/lib/server/models";
import { exigirSessao } from "@/lib/server/sessao";

export const metadata: Metadata = { title: "Provas" };

const fmtData = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Sem data");

export default async function Painel() {
  const { userId } = await exigirSessao();
  await conectar();
  const dono = new Types.ObjectId(userId);
  const provas = await Prova.find({ ownerId: dono }).sort({ _id: -1 }).lean();
  const contagem = await Cavaleiro.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { ownerId: dono, status: { $ne: "PENDENTE" } } },
    { $group: { _id: "$provaId", n: { $sum: 1 } } },
  ]);
  const inscritos = new Map(contagem.map((c) => [String(c._id), c.n]));

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Suas provas</h1>
          <p className="mt-1 text-sm text-neutral-400">Mesmas provas do SAHDI — os dois sistemas usam o mesmo banco.</p>
        </div>
      </div>
      {provas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-eqs-line p-10 text-center text-neutral-400">
          Nenhuma prova cadastrada ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {provas.map((p) => (
            <li key={String(p._id)}>
              <Link
                href={`/painel/provas/${p._id}`}
                className="group flex h-full flex-col rounded-xl border border-eqs-line bg-eqs-ink-2 p-5 transition hover:border-eqs-red"
              >
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className="rounded bg-eqs-red/15 px-2 py-0.5 text-red-300">{p.tipo === "SALTO" ? "Salto" : "Adestramento"}</span>
                  <span className={p.status === "ATIVA" ? "text-emerald-400" : "text-neutral-500"}>{p.status}</span>
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug group-hover:text-white">{p.nome}</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  {[p.local, fmtData(p.data)].filter(Boolean).join(" · ")}
                </p>
                <p className="mt-auto pt-4 text-sm text-neutral-300">
                  <strong className="text-white">{inscritos.get(String(p._id)) ?? 0}</strong> inscrito(s)
                  {p.tipo !== "SALTO" && <> · {p.reprises?.length ?? 0} reprise(s)</>}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
