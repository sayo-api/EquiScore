import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Reprise, ResultadoSalto } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { IconVoltar } from "@/lib/icons";
import { FolhaAdestramento } from "./folha-adest";
import { FolhaSalto } from "./folha-salto";

export default async function JulgarCav({ params }: PageProps<"/painel/provas/[id]/julgar/[cav]">) {
  const { id, cav } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  if (!isValidObjectId(cav)) notFound();
  await conectar();
  const c = await Cavaleiro.findOne({ _id: cav, provaId: prova._id }).lean<Record<string, unknown>>();
  if (!c) notFound();
  const cabecalho = (
    <div className="mb-4">
      <Link href={`/painel/provas/${id}/julgar`} className="inline-flex items-center gap-1 text-sm text-mut hover:text-red"><IconVoltar width={16} height={16} /> Julgar</Link>
      <h2 className="mt-1 text-xl font-black">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}</h2>
      <p className="text-sm text-mut">{String(c.cavalo)}</p>
    </div>
  );

  if (prova.tipo === "SALTO") {
    const r = await ResultadoSalto.findOne({ cavaleiroId: c._id }).lean<Record<string, unknown>>();
    return (<div>{cabecalho}<FolhaSalto provaId={id} cavId={String(c._id)}
      baremo={String(prova.baremo || "220.2.1.1")} tempoConcedido={Number(prova.tempoConcedido || 80)}
      inicial={r ? { tempoMs: Number(r.tempoMs || 0), derrubadas: Number(r.derrubadas || 0), recuos: Number(r.recuos || 0), quedaCavalo: !!r.quedaCavalo, forfait: !!r.forfait } : null} /></div>);
  }

  const reprise = await Reprise.findById(c.repriseId).lean<Record<string, unknown>>();
  if (!reprise) notFound();
  const avals = await Avaliacao.find({ cavaleiroId: c._id, repriseId: c.repriseId }).lean<Record<string, unknown>[]>();
  const salvas: Record<string, unknown> = {};
  for (const a of avals) salvas[String(a.juizLetra)] = a;
  const letras = ["C", "B", "E", "H", "M"].slice(0, Math.max(1, Math.min(5, Number(prova.numJuizes || 1))));
  return (<div>{cabecalho}<FolhaAdestramento provaId={id} cavId={String(c._id)} letras={letras}
    reprise={{ nome: String(reprise.nome), pontuacaoMaxima: Number(reprise.pontuacaoMaxima), qtdMovimentos: Number(reprise.qtdMovimentos || 0), movimentos: reprise.movimentos as never, notasConjunto: reprise.notasConjunto as never }}
    salvas={JSON.parse(JSON.stringify(salvas))} /></div>);
}
