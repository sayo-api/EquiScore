import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Auditoria } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { IconRelogio } from "@/lib/icons";

const fmt = (d: unknown) => (d ? new Date(d as string).toLocaleString("pt-BR") : "");

export default async function Historico({ params }: PageProps<"/painel/provas/[id]/historico">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const itens = await Auditoria.find({ provaId: new Types.ObjectId(String(prova._id)) }).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div className="eqs-in">
      <h2 className="mb-1 text-lg font-black">Histórico de alterações</h2>
      <p className="mb-4 text-sm text-mut">As 200 ações mais recentes nesta prova.</p>
      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-10 text-center text-mut">Nenhuma alteração registrada ainda.</p>
      ) : (
        <ol className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
          {itens.map((a) => (
            <li key={String(a._id)} className="flex items-start gap-3 border-t border-line2 px-4 py-3 first:border-0">
              <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-surf2 text-mut"><IconRelogio width={15} height={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-semibold">{String(a.acao || "")}</span>
                  {a.resumo ? <span className="truncate text-sm text-mut">— {String(a.resumo)}</span> : null}
                </div>
                <div className="text-xs text-dim">{[String(a.autor || "—"), fmt(a.createdAt)].filter(Boolean).join(" · ")}</div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
