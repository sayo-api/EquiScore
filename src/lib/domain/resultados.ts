/**
 * Monta os grupos de resultado para telão, acompanhar e PDF, a partir dos dados
 * já apurados. Reúne adestramento (por reprise) e salto (por categoria/altura).
 */
import { classificar, type StatusAvaliacao } from "./adestramento";
import { classificarSalto, type BaremoTipo, type StatusPercurso } from "./salto";

export interface NotaJuizLinha {
  letra: string;
  valor: string; // percentual formatado, ou "—"/"EL"
  posicao: number | null; // colocação daquele juiz nesta reprise (estilo FEI)
}
export interface LinhaResultado {
  id?: string;
  posicao: number | null;
  ordemEntrada: number;
  conjunto: string; // "Posto Nome"
  cavalo: string;
  status: string;
  resumo: string; // texto curto: percentual, ou penalidades+tempo
  eliminado: boolean;
  porJuiz?: NotaJuizLinha[]; // colunas por juiz (adestramento)
}
export interface GrupoResultado {
  titulo: string;
  colunaValor: string; // "%" ou "Pen · Tempo"
  juizes?: string[]; // letras dos juízes (adestramento), para as colunas
  linhas: LinhaResultado[];
}

const fmtPct = (n: number) => n.toFixed(3).replace(".", ",") + "%";
export const fmtTempo = (ms: number) => {
  const s = ms / 1000;
  return s.toFixed(2).replace(".", ",") + "s";
};

export interface NotaJuizEntrada {
  letra: string;
  percentual: number;
  temNota: boolean;
}
export interface EntradaAdest {
  id?: string;
  ordemEntrada: number;
  conjunto: string;
  cavalo: string;
  status: StatusAvaliacao;
  percentual: number;
  porJuiz?: NotaJuizEntrada[];
}
export function grupoAdestramento(titulo: string, itens: EntradaAdest[], juizes: string[] = []): GrupoResultado {
  const ord = classificar(itens);
  let pos = 0;

  // Sub-ranking por juiz (estilo FEI): para cada letra, ordena os conjuntos
  // desta reprise que têm nota daquele juiz e grava a colocação (1, 2, 3…).
  const posJuiz = new Map<string, Map<number, number>>(); // letra -> (ordemEntrada -> posição)
  for (const letra of juizes) {
    const comNota = ord
      .map((x) => ({ x, j: x.porJuiz?.find((p) => p.letra === letra) }))
      .filter((r) => r.j && r.j.temNota && x_notElim(r.x.status))
      .sort((a, b) => (b.j!.percentual) - (a.j!.percentual));
    const m = new Map<number, number>();
    comNota.forEach((r, i) => m.set(r.x.ordemEntrada, i + 1));
    posJuiz.set(letra, m);
  }

  return {
    titulo,
    colunaValor: "%",
    juizes: juizes.length ? juizes : undefined,
    linhas: ord.map((x) => {
      const finalizado = x.status === "FINALIZADO";
      if (finalizado) pos++;
      const porJuiz: NotaJuizLinha[] | undefined = juizes.length
        ? juizes.map((letra) => {
            const j = x.porJuiz?.find((p) => p.letra === letra);
            const elim = x.status === "ELIMINADO";
            return {
              letra,
              valor: elim ? "EL" : j && j.temNota ? fmtPct(j.percentual) : "—",
              posicao: !elim && j && j.temNota ? posJuiz.get(letra)?.get(x.ordemEntrada) ?? null : null,
            };
          })
        : undefined;
      return {
        id: x.id,
        posicao: finalizado ? pos : null,
        ordemEntrada: x.ordemEntrada,
        conjunto: x.conjunto,
        cavalo: x.cavalo,
        status: x.status,
        resumo: x.status === "AGUARDANDO" ? "—" : x.status === "ELIMINADO" ? "EL" : fmtPct(x.percentual),
        eliminado: x.status === "ELIMINADO",
        porJuiz,
      };
    }),
  };
}

const x_notElim = (s: StatusAvaliacao) => s !== "ELIMINADO" && s !== "AGUARDANDO";

export interface EntradaSalto {
  ordemEntrada: number;
  conjunto: string;
  cavalo: string;
  status: StatusPercurso | "aguardando";
  penalidadesTotais: number;
  penalidadesFaltas: number;
  penalidadesTempo: number;
  tempoMs: number;
  diferencaIdeal: number | null;
}
export function grupoSalto(titulo: string, tipo: BaremoTipo, itens: EntradaSalto[]): GrupoResultado {
  const ord = classificarSalto(itens, tipo);
  let pos = 0;
  return {
    titulo,
    colunaValor: tipo === "tempo_ideal" ? "Dif. ideal" : tipo === "tabela_c" ? "Tempo total" : "Pen · Tempo",
    linhas: ord.map((x) => {
      const concluido = x.status === "concluido";
      if (concluido) pos++;
      let resumo = "—";
      if (x.status === "eliminado") resumo = "EL";
      else if (concluido) {
        if (tipo === "tempo_ideal") resumo = (x.diferencaIdeal ?? 0).toFixed(2).replace(".", ",") + "s";
        else if (tipo === "tabela_c") resumo = fmtTempo(x.tempoMs);
        else resumo = `${x.penalidadesTotais} · ${fmtTempo(x.tempoMs)}`;
      }
      return {
        posicao: concluido ? pos : null,
        ordemEntrada: x.ordemEntrada,
        conjunto: x.conjunto,
        cavalo: x.cavalo,
        status: x.status,
        resumo,
        eliminado: x.status === "eliminado",
      };
    }),
  };
}
