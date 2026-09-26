import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { ordenar } from "@/lib/domain/ordem";
import { IconTv } from "@/lib/icons";
import { marcarEmPista } from "./actions";

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
  const emPista = prova.cavaleiroEmPista ? String(prova.cavaleiroEmPista) : "";
  const chave = (c: (typeof comps)[number]) => (tipo === "ADESTRAMENTO" ? String(c.repriseId || "") : String(c.categoria || ""));
  const ordemChaves = tipo === "ADESTRAMENTO" ? ((prova.reprises as Types.ObjectId[]) || []).map(String) : [...new Set(comps.map(chave))];
  const itens = ordenar(comps.map((c) => ({ ...c, chaveReprise: chave(c), ordemEntrada: Number(c.ordemEntrada || 0) })), !!prova.mesclar, ordemChaves);
  if (!itens.length) return <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Nenhum inscrito para julgar.</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-mut">Marque quem está <b className="text-red">em pista</b> para destacar nos telões e nas telas dos juízes.</p>
      <ul className="overflow-hidden rounded-xl border border-line bg-surf shadow-sm">
        {itens.map((c) => {
          const cid = String(c._id);
          const atual = cid === emPista;
          const marcar = marcarEmPista.bind(null, id, atual ? null : cid);
          return (
            <li key={cid} className={`flex items-center gap-2 border-t border-line2 px-4 py-2.5 first:border-0 ${atual ? "bg-redwash" : ""}`}>
              <Link href={`/painel/provas/${id}/julgar/${cid}`} className="flex flex-1 items-center gap-3 transition hover:opacity-80">
                <span className="w-8 text-center font-mono font-bold text-red">{c.ordemEntrada || "—"}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}
                    {atual && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red px-2 py-0.5 align-[1px] text-[10px] font-bold text-white"><IconTv width={11} height={11} /> EM PISTA</span>}
                  </span>
                  <span className="block text-sm text-mut">{c.cavalo}{tipo === "ADESTRAMENTO" ? ` · ${nomeRep.get(String(c.repriseId)) ?? "—"}` : c.categoria ? ` · ${c.categoria}` : ""}</span>
                </span>
                <span className={`text-xs font-bold ${COR[String(c.status)] ?? "text-dim"}`}>{c.status}</span>
              </Link>
              <form action={marcar}>
                <button data-som="off" className={`whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-bold transition active:scale-95 ${atual ? "border-red bg-red text-white" : "border-line text-mut hover:border-red hover:text-red"}`}>
                  {atual ? "Na pista" : "Em pista"}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
