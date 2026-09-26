import "server-only";
import { isValidObjectId, Types } from "mongoose";
import { conectar } from "./db";
import { Avaliacao, Cavaleiro, Juiz, Prova, Reprise, ResultadoSalto } from "./models";
import { apurarFolha, consolidarJuizes, type FolhaDoJuiz, type Reprise as TReprise } from "@/lib/domain/adestramento";
import { baremoPorId } from "@/lib/domain/salto";
import { grupoAdestramento, grupoSalto, type GrupoResultado, type EntradaAdest, type EntradaSalto } from "@/lib/domain/resultados";

type Plain = Record<string, unknown>;

/** Carrega uma prova garantindo que pertence ao organizador. */
export async function provaDoDono(id: string, userId: string) {
  if (!isValidObjectId(id)) return null;
  await conectar();
  return Prova.findOne({ _id: id, ownerId: new Types.ObjectId(userId) }).lean<Plain>();
}

export async function provaPublica(id: string) {
  if (!isValidObjectId(id)) return null;
  await conectar();
  return Prova.findById(id).lean<Plain>();
}

const nomeConj = (c: Plain) => [c.postoGraduacao, c.nome].filter(Boolean).join(" ").trim();

/** Monta os grupos de resultado de uma prova (adestramento ou salto). */
export async function montarResultados(prova: Plain): Promise<GrupoResultado[]> {
  await conectar();
  const provaId = prova._id as Types.ObjectId;
  const comps = await Cavaleiro.find({ provaId, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean<Plain[]>();

  if (prova.tipo === "SALTO") {
    const resultados = await ResultadoSalto.find({ provaId }).lean<Plain[]>();
    const porCav = new Map(resultados.map((r) => [String(r.cavaleiroId), r]));
    const tipo = baremoPorId(String(prova.baremo || "220.2.1.1"))?.tipo ?? "tempo_concedido";
    // agrupa por categoria (altura); sem categoria, um grupo único
    const cats = [...new Set(comps.map((c) => String(c.categoria || "")))];
    const grupos: GrupoResultado[] = [];
    for (const cat of cats) {
      const itens: EntradaSalto[] = comps
        .filter((c) => String(c.categoria || "") === cat)
        .map((c) => {
          const r = porCav.get(String(c._id));
          return {
            ordemEntrada: Number(c.ordemEntrada || 0),
            conjunto: nomeConj(c),
            cavalo: String(c.cavalo || ""),
            status: r ? (r.status as "concluido" | "eliminado") : "aguardando",
            penalidadesTotais: Number(r?.penalidadesTotais || 0),
            penalidadesFaltas: Number(r?.penalidadesFaltas || 0),
            penalidadesTempo: Number(r?.penalidadesTempo || 0),
            tempoMs: Number(r?.tempoMs || 0),
            diferencaIdeal: r?.diferencaIdeal != null ? Number(r.diferencaIdeal) : null,
          };
        });
      grupos.push(grupoSalto(cat || "Classificação", tipo, itens));
    }
    return grupos;
  }

  // ADESTRAMENTO
  const reprises = await Reprise.find({ _id: { $in: prova.reprises || [] } }).lean<Plain[]>();
  const repriseMap = new Map(reprises.map((r) => [String(r._id), r]));
  const avals = await Avaliacao.find({ provaId }).lean<Plain[]>();
  const porCav = new Map<string, Plain[]>();
  for (const a of avals) {
    const k = String(a.cavaleiroId);
    (porCav.get(k) ?? porCav.set(k, []).get(k)!).push(a);
  }

  // Letras dos juízes: as cadastradas na prova + as presentes nas avaliações.
  const juizesProva = await Juiz.find({ provaId }).lean<Plain[]>();
  const letras = [...new Set([
    ...juizesProva.map((j) => String(j.juizLetra || "C")),
    ...avals.map((a) => String(a.juizLetra || "C")),
  ])].sort();

  const grupos: GrupoResultado[] = [];
  for (const rid of (prova.reprises || []) as Types.ObjectId[]) {
    const reprise = repriseMap.get(String(rid));
    if (!reprise) continue;
    const itens: EntradaAdest[] = comps
      .filter((c) => String(c.repriseId) === String(rid))
      .map((c) => {
        const brutas = porCav.get(String(c._id)) || [];
        const folhas = brutas.map(
          (a): FolhaDoJuiz => ({
            juizLetra: String(a.juizLetra || "C"),
            notasPista: (a.notasPista as { num: number; nota: number }[]) || [],
            notasConjunto: (a.notasConjunto as { num: number; nota: number }[]) || [],
            errosPercurso: Number(a.errosPercurso || 0),
            status: a.status as FolhaDoJuiz["status"],
          }),
        );
        const cons = consolidarJuizes(reprise as unknown as TReprise, folhas);
        const porJuiz = letras.map((letra) => {
          const f = folhas.find((x) => x.juizLetra === letra);
          if (!f) return { letra, percentual: 0, temNota: false };
          const r = apurarFolha(reprise as unknown as TReprise, f);
          const temNota = (f.notasPista || []).some((n) => n.nota != null) || (f.notasConjunto || []).some((n) => n.nota != null);
          return { letra, percentual: r.percentual, temNota: temNota && !r.eliminadoPorErros };
        });
        return {
          ordemEntrada: Number(c.ordemEntrada || 0),
          conjunto: nomeConj(c),
          cavalo: String(c.cavalo || ""),
          status: cons.status,
          percentual: cons.percentual,
          porJuiz,
        };
      });
    grupos.push(grupoAdestramento(String(reprise.nome || "Reprise"), itens, letras));
  }
  return grupos;
}
