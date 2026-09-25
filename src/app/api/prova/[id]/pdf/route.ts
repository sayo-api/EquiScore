import { cookies } from "next/headers";
import { montarResultados, provaDoDono } from "@/lib/server/consultas";
import { COOKIE_SESSAO, lerSessao } from "@/lib/server/sessao";
import { gerarPdfResultados } from "@/lib/server/pdf";

/** PDF do boletim (somente o organizador dono da prova). */
export async function GET(_: Request, { params }: RouteContext<"/api/prova/[id]/pdf">) {
  const { id } = await params;
  const sessao = await lerSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!sessao) return new Response("Não autorizado.", { status: 401 });
  const prova = await provaDoDono(id, sessao.userId);
  if (!prova) return new Response("Prova não encontrada.", { status: 404 });
  const grupos = await montarResultados(prova);
  const pdf = await gerarPdfResultados({ provaNome: String(prova.nome), local: String(prova.local || ""), data: prova.data as Date, grupos });
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="resultados-${id}.pdf"`,
    },
  });
}
