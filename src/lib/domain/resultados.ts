/**
 * Monta os grupos de resultado para telão, acompanhar e PDF, a partir dos dados
 * já apurados. Reúne adestramento (por reprise) e salto (por categoria/altura).
 */
import { classificar, type StatusAvaliacao } from "./adestramento";
import { classificarSalto, type BaremoTipo, type StatusPercurso } from "./salto";

export interface LinhaResultado {
  posicao: number | null;
  ordemEntrada: number;
  conjunto: string; // "Posto Nome"
  cavalo: string;
  status: string;
  resumo: string; // texto curto: percentual, ou penalidades+tempo
  eliminado: boolean;
}
export interface GrupoResultado {
  titulo: string;
  colunaValor: string; // "%" ou "Pen · Tempo"
  linhas: LinhaResultado[];
}

const fmtPct = (n: number) => n.toFixed(3).replace(".", ",") + "%";
export const fmtTempo = (ms: number) => {
  const s = ms / 1000;
  return s.toFixed(2).replace(".", ",") + "s";
};

export interface EntradaAdest {
  ordemEntrada: number;
  conjunto: string;
  cavalo: string;
  status: StatusAvaliacao;
  percentual: number;
}
export function grupoAdestramento(titulo: string, itens: EntradaAdest[]): GrupoResultado {
  const ord = classificar(itens);
  let pos = 0;
  return {
    titulo,
    colunaValor: "%",
    linhas: ord.map((x) => {
      const finalizado = x.status === "FINALIZADO";
      if (finalizado) pos++;
      return {
        posicao: finalizado ? pos : null,
        ordemEntrada: x.ordemEntrada,
        conjunto: x.conjunto,
        cavalo: x.cavalo,
        status: x.status,
        resumo: x.status === "AGUARDANDO" ? "—" : x.status === "ELIMINADO" ? "EL" : fmtPct(x.percentual),
        eliminado: x.status === "ELIMINADO",
      };
    }),
  };
}

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
