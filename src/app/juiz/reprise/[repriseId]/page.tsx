import Link from "next/link";
import { isValidObjectId, Types } from "mongoose";
import { notFound } from "next/navigation";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Reprise } from "@/lib/server/models";
import { exigirJuiz } from "@/lib/server/sessao";
import { IconVoltar, IconCheck, IconRelogio } from "@/lib/icons";

export default async function JuizReprise({ params }: PageProps<"/juiz/reprise/[repriseId]">) {
  const { repriseId } = await params;
  const j = await exigirJuiz();
  if (!isValidObjectId(repriseId)) notFound();
  await conectar();
  const reprise = await Reprise.findById(repriseId).lean<Record<string, unknown>>();
  if (!reprise) notFound();
  const provaId = new Types.ObjectId(String(j.provaId));
  const comps = await Cavaleiro.find({ provaId, repriseId, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean<Record<string, unknown>[]>();
  const avals = await Avaliacao.find({ provaId, repriseId, juizLetra: j.letra }).lean<Record<string, unknown>[]>();
  const porCav = new Map(avals.map((a) => [String(a.cavaleiroId), a]));

  return (
    <div className="eqs-in">
      <Link href="/juiz" className="inline-flex items-center gap-1 text-sm text-mut transition hover:text-red"><IconVoltar width={16} height={16} /> Séries</Link>
      <h1 className="mt-2 text-2xl font-black tracking-tight">{String(reprise.nome)}</h1>
      <p className="mt-1 text-sm text-mut">Letra <b className="text-red">{j.letra}</b> · toque no conjunto para lançar as notas.</p>

      {comps.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-10 text-center text-mut">Nenhum conjunto nesta reprise.</p>
      ) : (
        <ul className="mt-5 overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
          {comps.map((c) => {
            const a = porCav.get(String(c._id));
            const st = a?.status as string | undefined;
            const nome = [c.postoGraduacao, c.nome].filter(Boolean).join(" ");
            return (
              <li key={String(c._id)}>
                <Link href={`/juiz/reprise/${repriseId}/${c._id}`} className="flex items-center gap-3 border-t border-line2 px-4 py-3 transition first:border-0 hover:bg-surf2 active:scale-[.99]">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-surf2 font-mono text-sm font-bold text-mut">{Number(c.ordemEntrada) || "–"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{nome}</div>
                    <div className="truncate text-xs text-mut">{String(c.cavalo)}</div>
                  </div>
                  {st === "FINALIZADO" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-okwash px-2.5 py-1 text-xs font-bold text-ok"><IconCheck width={13} height={13} /> {Number(a?.percentualFinal || 0) > 0 ? "" : ""}Lançado</span>
                  ) : st === "ELIMINADO" ? (
                    <span className="rounded-full bg-redwash px-2.5 py-1 text-xs font-bold text-red6">Eliminado</span>
                  ) : st === "EM_ANDAMENTO" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warnwash px-2.5 py-1 text-xs font-bold text-warn"><IconRelogio width={13} height={13} /> Rascunho</span>
                  ) : (
                    <span className="rounded-full bg-surf2 px-2.5 py-1 text-xs font-semibold text-dim">A lançar</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
