import type { Metadata } from "next";
import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova } from "@/lib/server/models";
import { exigirSessao } from "@/lib/server/sessao";
import { IconPlus } from "@/lib/icons";

export const metadata: Metadata = { title: "Provas" };
const fmtData = (d?: Date | null) => (d ? new Date(d).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Sem data");

export default async function Painel() {
  const { userId } = await exigirSessao();
  await conectar();
  const dono = new Types.ObjectId(userId);
  const provas = await Prova.find({ ownerId: dono }).sort({ _id: -1 }).lean();
  const cont = await Cavaleiro.aggregate<{ _id: Types.ObjectId; n: number }>([
    { $match: { ownerId: dono, status: { $ne: "PENDENTE" } } },
    { $group: { _id: "$provaId", n: { $sum: 1 } } },
  ]);
  const insc = new Map(cont.map((c) => [String(c._id), c.n]));

  return (
    <div className="eqs-in">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Suas provas</h1>
          <p className="mt-1 text-sm text-mut">Crie e gerencie provas de adestramento e salto.</p>
        </div>
        <Link href="/painel/nova" className="inline-flex items-center gap-2 rounded-lg bg-red px-4 py-2.5 font-bold text-white shadow-sm transition hover:bg-red6">
          <IconPlus width={18} height={18} /> Nova prova
        </Link>
      </div>
      {provas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-mut">Nenhuma prova ainda. Clique em “Nova prova”.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {provas.map((p) => (
            <li key={String(p._id)}>
              <Link href={`/painel/provas/${p._id}`} className="group flex h-full flex-col rounded-xl border border-line bg-surf p-5 shadow-sm transition hover:border-redln hover:shadow-md">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider">
                  <span className="rounded bg-redwash px-2 py-0.5 text-red6">{p.tipo === "SALTO" ? "Salto" : "Adestramento"}</span>
                  <span className={p.status === "ATIVA" ? "text-ok" : "text-dim"}>{p.status}</span>
                  {p.publicadoEm && <span className="text-dim">· publicada</span>}
                </div>
                <h2 className="mt-3 text-lg font-bold leading-snug">{p.nome}</h2>
                <p className="mt-1 text-sm text-mut">{[p.local, fmtData(p.data)].filter(Boolean).join(" · ")}</p>
                <p className="mt-auto pt-4 text-sm text-mut"><strong className="text-ink">{insc.get(String(p._id)) ?? 0}</strong> inscrito(s)</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
