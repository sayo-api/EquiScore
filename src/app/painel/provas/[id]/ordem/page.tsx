import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { ordenar, avisosDeGap } from "@/lib/domain/ordem";
import { OrdemCliente } from "./cliente";

export default async function Ordem({ params }: PageProps<"/painel/provas/[id]/ordem">) {
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
  const itens = ordenar(comps.map((c) => ({
    id: String(c._id), nome: String(c.nome), posto: String(c.postoGraduacao || ""), cavalo: String(c.cavalo || ""),
    chaveReprise: chave(c), rotulo: tipo === "ADESTRAMENTO" ? (nomeRep.get(String(c.repriseId)) ?? "—") : String(c.categoria || "—"),
    ordemEntrada: Number(c.ordemEntrada || 0),
  })), !!prova.mesclar, ordemChaves);
  const avisos = [...avisosDeGap(itens.map((i) => i.nome))];
  return (
    <OrdemCliente provaId={id} mesclar={!!prova.mesclar} itens={itens} avisosIniciais={avisos}
      inicio={String(prova.inicioHorario || "08:00")} minutos={Number(prova.minutosPorConjunto || 7)}
      intervalos={((prova.intervalos as { aposOrdem: number; minutos: number }[]) || []).map((i) => ({ aposOrdem: Number(i.aposOrdem), minutos: Number(i.minutos) }))} />
  );
}
