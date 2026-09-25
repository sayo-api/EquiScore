import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { ordenar } from "@/lib/domain/ordem";

const COR: Record<string, string> = { FINALIZADO: "text-ok", ELIMINADO: "text-red", EM_ANDAMENTO: "text-warn", AGUARDANDO: "text-dim" };

export default async function Julgar({ params }: PageProps<"/painel/provas/[id]/julgar">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const comps = await Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  const nomeRep = new Map(reprises.map((r) => [String(r._id), String(r.nome)]));
  const tipo = String(prova.tipo);
  const chave = (c: (typeof comps)[number]) => (tipo === "ADESTRAMENTO" ? String(c.repriseId || "") : String(c.categoria || ""));
  const ordemChaves = tipo === "ADESTRAMENTO" ? ((prova.reprises as Types.ObjectId[]) || []).map(String) : [...new Set(comps.map(chave))];
  const itens = ordenar(comps.map((c) => ({ ...c, chaveReprise: chave(c), ordemEntrada: Number(c.ordemEntrada || 0) })), !!prova.mesclar, ordemChaves);
  if (!itens.length) return <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Nenhum inscrito para julgar.</p>;
  return (
    <ul className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
      {itens.map((c) => (
        <li key={String(c._id)}>
          <Link href={`/painel/provas/${id}/julgar/${c._id}`} className="flex items-center gap-3 border-t border-line2 px-4 py-3 transition hover:bg-surf2 first:border-0">
            <span className="w-8 text-center font-mono font-bold text-red">{c.ordemEntrada || "—"}</span>
            <span className="flex-1">
              <span className="block font-semibold">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}</span>
              <span className="block text-sm text-mut">{c.cavalo}{tipo === "ADESTRAMENTO" ? ` · ${nomeRep.get(String(c.repriseId)) ?? "—"}` : c.categoria ? ` · ${c.categoria}` : ""}</span>
            </span>
            <span className={`text-xs font-bold ${COR[String(c.status)] ?? "text-dim"}`}>{c.status}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
