import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { CartoesLink } from "./cliente";

export default async function Links({ params }: PageProps<"/painel/provas/[id]/links">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  await provaDoDono(id, userId);
  return <CartoesLink provaId={id} />;
}
