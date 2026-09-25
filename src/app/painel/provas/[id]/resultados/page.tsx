import { conectar } from "@/lib/server/db";
import { Publicacao } from "@/lib/server/models";
import { montarResultados, provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { ResultadoGrupos } from "@/components/resultado-grupos";
import { BotoesPublicar } from "./cliente";

export default async function Resultados({ params }: PageProps<"/painel/provas/[id]/resultados">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  const grupos = await montarResultados(prova);
  await conectar();
  const pub = await Publicacao.findOne({ provaId: prova._id }).lean<Record<string, unknown>>();
  return (
    <div>
      <BotoesPublicar provaId={id} publicado={!!prova.publicadoEm} pdfUrl={(pub?.pdfUrl as string) || null} />
      <div className="mt-5"><ResultadoGrupos grupos={grupos} /></div>
    </div>
  );
}
