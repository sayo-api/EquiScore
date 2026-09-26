import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Reprise } from "@/lib/server/models";
import { exigirJuiz } from "@/lib/server/sessao";
import { IconVoltar } from "@/lib/icons";
import { FolhaJuiz } from "./folha";

export default async function JuizFolha({ params }: PageProps<"/juiz/reprise/[repriseId]/[cav]">) {
  const { repriseId, cav } = await params;
  const j = await exigirJuiz();
  if (!isValidObjectId(repriseId) || !isValidObjectId(cav)) notFound();
  await conectar();
  const c = await Cavaleiro.findOne({ _id: cav, provaId: j.provaId, repriseId }).lean<Record<string, unknown>>();
  if (!c) notFound();
  const reprise = await Reprise.findById(repriseId).lean<Record<string, unknown>>();
  if (!reprise) notFound();
  const a = await Avaliacao.findOne({ cavaleiroId: c._id, repriseId, juizLetra: j.letra }).lean<Record<string, unknown>>();
  const salva = a
    ? { notasPista: a.notasPista as { num: number; nota: number }[], notasConjunto: a.notasConjunto as { num: number; nota: number }[], errosPercurso: Number(a.errosPercurso || 0) }
    : null;

  return (
    <div className="eqs-in">
      <Link href={`/juiz/reprise/${repriseId}`} className="inline-flex items-center gap-1 text-sm text-mut transition hover:text-red"><IconVoltar width={16} height={16} /> {String(reprise.nome)}</Link>
      <h1 className="mt-1 text-xl font-black">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}</h1>
      <p className="mb-4 text-sm text-mut">{String(c.cavalo)}</p>
      <FolhaJuiz repriseId={repriseId} cavId={String(c._id)} letra={j.letra}
        reprise={{ nome: String(reprise.nome), pontuacaoMaxima: Number(reprise.pontuacaoMaxima), qtdMovimentos: Number(reprise.qtdMovimentos || 0), movimentos: reprise.movimentos as never, notasConjunto: reprise.notasConjunto as never }}
        salva={salva ? JSON.parse(JSON.stringify(salva)) : null} />
    </div>
  );
}
