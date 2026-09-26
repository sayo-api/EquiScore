import { cookies } from "next/headers";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { COOKIE_SESSAO, lerSessao } from "@/lib/server/sessao";
import { ordenar } from "@/lib/domain/ordem";
import { gerarPdfOrdem, type LinhaOrdem } from "@/lib/server/pdf";

function horaDe(inicio: string, min: number, i: number, extra: number) {
  const [h, m] = inicio.split(":").map(Number);
  const t = h * 60 + m + i * min + extra;
  return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

export async function GET(_: Request, { params }: RouteContext<"/api/prova/[id]/ordem-pdf">) {
  const { id } = await params;
  const sessao = await lerSessao((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!sessao) return new Response("Não autorizado.", { status: 401 });
  const prova = await provaDoDono(id, sessao.userId);
  if (!prova) return new Response("Prova não encontrada.", { status: 404 });
  await conectar();

  const comps = await Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  const nomeRep = new Map(reprises.map((r) => [String(r._id), String(r.nome)]));
  const tipo = String(prova.tipo);
  const chave = (c: (typeof comps)[number]) => (tipo === "ADESTRAMENTO" ? String(c.repriseId || "") : String(c.categoria || ""));
  const ordemChaves = tipo === "ADESTRAMENTO" ? ((prova.reprises as Types.ObjectId[]) || []).map(String) : [...new Set(comps.map(chave))];
  const itens = ordenar(comps.map((c) => ({
    id: String(c._id), nome: String(c.nome), posto: String(c.postoGraduacao || ""), cavalo: String(c.cavalo || ""),
    chaveReprise: chave(c), rotulo: tipo === "ADESTRAMENTO" ? (nomeRep.get(String(c.repriseId)) ?? "—") : String(c.categoria || "—"),
    ordemEntrada: Number(c.ordemEntrada || 0),
  })), !!prova.mesclar, ordemChaves);

  const inicio = String(prova.inicioHorario || "08:00");
  const minutos = Number(prova.minutosPorConjunto || 7);
  const intervalos = ((prova.intervalos as { aposOrdem: number; minutos: number }[]) || []).map((x) => ({ aposOrdem: Number(x.aposOrdem), minutos: Number(x.minutos) }));
  const offset = (i: number) => intervalos.filter((x) => x.aposOrdem <= i).reduce((s, x) => s + x.minutos, 0);

  const linhas: LinhaOrdem[] = itens.map((it, i) => ({
    pos: i + 1,
    hora: horaDe(inicio, minutos, i, offset(i)),
    conjunto: [it.posto, it.nome].filter(Boolean).join(" "),
    cavalo: it.cavalo,
    rotulo: it.rotulo,
    intervaloMin: intervalos.find((x) => x.aposOrdem === i + 1)?.minutos,
  }));

  const pdf = await gerarPdfOrdem({
    provaNome: String(prova.nome), local: String(prova.local || ""), data: prova.data as Date,
    inicio, minutos, mesclar: !!prova.mesclar, linhas,
  });
  return new Response(Buffer.from(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="ordem-${id}.pdf"` },
  });
}
