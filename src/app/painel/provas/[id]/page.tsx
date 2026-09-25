import { redirect } from "next/navigation";
export default async function ProvaIndex({ params }: PageProps<"/painel/provas/[id]">) {
  const { id } = await params;
  redirect(`/painel/provas/${id}/inscricoes`);
}
