import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova, Reprise } from "@/lib/server/models";
import { exigirJuiz } from "@/lib/server/sessao";
import { IconLista, IconVoltar } from "@/lib/icons";

export default async function JuizInicio() {
  const j = await exigirJuiz();
  await conectar();
  const prova = await Prova.findById(j.provaId).lean<Record<string, unknown>>();
  const ordem = ((prova?.reprises || []) as Types.ObjectId[]).map(String);
  const reprises = await Reprise.find({ _id: { $in: ordem } }).lean<Record<string, unknown>[]>();
  reprises.sort((a, b) => ordem.indexOf(String(a._id)) - ordem.indexOf(String(b._id)));

  const provaId = new Types.ObjectId(String(j.provaId));
  const contagem = await Cavaleiro.aggregate<{ _id: { r: Types.ObjectId; s: string }; n: number }>([
    { $match: { provaId, status: { $ne: "PENDENTE" } } },
    { $group: { _id: { r: "$repriseId", s: "$status" }, n: { $sum: 1 } } },
  ]);
  const stats = new Map<string, { total: number; falta: number }>();
  for (const c of contagem) {
    const rid = String(c._id.r);
    const s = stats.get(rid) ?? stats.set(rid, { total: 0, falta: 0 }).get(rid)!;
    s.total += c.n;
    if (c._id.s === "AGUARDANDO" || c._id.s === "EM_ANDAMENTO") s.falta += c.n;
  }

  return (
    <div className="eqs-in">
      <h1 className="text-2xl font-black tracking-tight">Séries / Reprises</h1>
      <p className="mt-1 text-sm text-mut">Escolha a reprise para lançar as notas da letra <b className="text-red">{j.letra}</b>.</p>
      {reprises.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-mut">Nenhuma reprise nesta prova.</p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {reprises.map((r) => {
            const st = stats.get(String(r._id)) || { total: 0, falta: 0 };
            return (
              <li key={String(r._id)}>
                <Link href={`/juiz/reprise/${r._id}`} className="group flex items-center justify-between gap-3 rounded-xl border border-line bg-surf p-4 shadow-sm transition hover:border-redln hover:shadow-md active:scale-[.99]">
                  <div>
                    <div className="flex items-center gap-2 font-bold"><IconLista width={16} height={16} className="text-red" /> {String(r.nome)}</div>
                    <div className="mt-0.5 text-xs text-mut">{st.total} conjunto{st.total === 1 ? "" : "s"} · {st.falta} a lançar</div>
                  </div>
                  <IconVoltar width={18} height={18} className="rotate-180 text-dim transition group-hover:text-red" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
