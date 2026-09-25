/**
 * Regras de apuração do salto (Regulamento CBH) — provas tradicionais de uma
 * volta. Sem equipes e sem campeonato. Funções puras, cobertas por testes.
 *
 * Baremos cobertos:
 *  - tempo_concedido  Tabela A ao cronômetro (220.2): faltas + 1 pt/seg acima do TC.
 *  - tabela_a         Tabela A sem cronômetro (220.1): igual, mas o tempo não
 *                     desempata a classificação.
 *  - tempo_ideal      (220.3.1): classifica pela menor diferença ao tempo ideal.
 *  - faixa_tempo      (220.3.2): penaliza fora da faixa [TC−2(TC−ideal), TC].
 *  - tabela_c         (217/225): faltas viram segundos somados ao tempo; vence o menor.
 */

export type BaremoTipo = "tempo_concedido" | "tabela_a" | "tempo_ideal" | "faixa_tempo" | "tabela_c";

export interface Baremo {
  id: string;
  nome: string;
  tipo: BaremoTipo;
  cronometro: boolean;
  desc: string;
}

/** Baremos oferecidos ao criar uma prova de salto tradicional. */
export const BAREMOS: Baremo[] = [
  {
    id: "220.2.1.1",
    nome: "Tabela A ao cronômetro",
    tipo: "tempo_concedido",
    cronometro: true,
    desc: "O mais comum. Igualdade de penalidades é desempatada pelo menor tempo. Exceder o tempo concedido custa 1 ponto por segundo ou fração.",
  },
  {
    id: "220.1.1.1",
    nome: "Tabela A sem cronômetro",
    tipo: "tabela_a",
    cronometro: false,
    desc: "Exceder o tempo concedido custa 1 ponto por segundo, mas o tempo não é critério de classificação; empatados dividem a colocação.",
  },
  {
    id: "220.3.1",
    nome: "Tempo ideal",
    tipo: "tempo_ideal",
    cronometro: true,
    desc: "Classifica pela menor diferença até o tempo ideal (padrão: 95% do tempo concedido). Não há penalidade de tempo.",
  },
  {
    id: "220.3.2",
    nome: "Faixa de tempo",
    tipo: "faixa_tempo",
    cronometro: true,
    desc: "Penaliza por segundo abaixo ou acima da faixa. Dentro da faixa, sem penalidade de tempo.",
  },
  {
    id: "217.2",
    nome: "Tabela C (velocidade)",
    tipo: "tabela_c",
    cronometro: true,
    desc: "Cada falta vira segundos somados ao tempo. Vence o menor tempo total.",
  },
];

export const baremoPorId = (id: string): Baremo | undefined => BAREMOS.find((b) => b.id === id);

/** Tempos automáticos a partir de distância (m) e velocidade (m/min). */
export function temposAuto(distancia: number, velocidade: number) {
  if (!distancia || !velocidade) return null;
  const tempoConcedido = Math.ceil((distancia * 60) / velocidade);
  return { tempoConcedido, tempoIdeal: Math.round(tempoConcedido * 0.95), tempoLimite: tempoConcedido * 2 };
}

export interface PercursoEntrada {
  tipo: BaremoTipo;
  tempoMs: number;
  /** Tempo concedido (A) ou tempo limite (C), em segundos. */
  tempoConcedido: number;
  /** Tempo ideal em segundos; se ausente, usa 95% do concedido. */
  tempoIdeal?: number | null;
  derrubadas?: number;
  /** Recuos/desobediências: a 2ª elimina. */
  recuos?: number;
  quedaCavalo?: boolean;
  forfait?: boolean;
  pontosPorSegundo?: number;
  pontosDerrubada?: number;
  pontosRecuo?: number;
}

export type StatusPercurso = "concluido" | "eliminado";

export interface ResultadoPercurso {
  status: StatusPercurso;
  motivoEliminacao: string | null;
  penalidadesFaltas: number;
  penalidadesTempo: number;
  penalidadesTotais: number;
  tempoIdeal: number | null;
  /** Diferença ao tempo ideal (só em tempo_ideal/faixa_tempo). */
  diferencaIdeal: number | null;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Penalidades de um percurso, conforme o baremo. */
export function calcularPercurso(o: PercursoEntrada): ResultadoPercurso {
  const tempo = (o.tempoMs || 0) / 1000;
  const d = o.derrubadas || 0;
  const rec = o.recuos || 0;
  const TC = o.tempoConcedido || 80;
  const pps = o.pontosPorSegundo ?? 1;
  const valD = o.pontosDerrubada ?? 4;
  const valR = o.pontosRecuo ?? 4;

  const elim = (motivo: string): ResultadoPercurso => ({
    status: "eliminado",
    motivoEliminacao: motivo,
    penalidadesFaltas: 0,
    penalidadesTempo: 0,
    penalidadesTotais: 0,
    tempoIdeal: null,
    diferencaIdeal: null,
  });

  if (o.forfait) return elim("Forfait / desistência");
  if (o.quedaCavalo) return elim("Queda do cavalo ou atleta");
  if (rec >= 2) return elim("2ª desobediência");

  if (o.tipo === "tabela_c") {
    if (tempo > TC) return elim("Excedeu o tempo limite");
    const faltasSeg = d * valD + rec * valR;
    return {
      status: "concluido",
      motivoEliminacao: null,
      penalidadesFaltas: faltasSeg,
      penalidadesTempo: 0,
      penalidadesTotais: r2(tempo + faltasSeg),
      tempoIdeal: null,
      diferencaIdeal: null,
    };
  }

  const faltas = d * valD + rec * valR;
  const ideal = o.tempoIdeal != null && Number.isFinite(o.tempoIdeal) ? Number(o.tempoIdeal) : Math.round(TC * 0.95);

  if (o.tipo === "tempo_ideal") {
    if (tempo > TC * 2) return elim("Excedeu o tempo limite (2×TC)");
    return {
      status: "concluido",
      motivoEliminacao: null,
      penalidadesFaltas: faltas,
      penalidadesTempo: 0,
      penalidadesTotais: faltas,
      tempoIdeal: ideal,
      diferencaIdeal: r2(Math.abs(tempo - ideal)),
    };
  }

  if (o.tipo === "faixa_tempo") {
    if (tempo > TC * 2) return elim("Excedeu o tempo limite (2×TC)");
    const baixa = TC - 2 * (TC - ideal);
    let pTempo = 0;
    if (tempo < baixa) pTempo = Math.ceil(baixa - tempo) * pps;
    else if (tempo > TC) pTempo = Math.ceil(tempo - TC) * pps;
    return {
      status: "concluido",
      motivoEliminacao: null,
      penalidadesFaltas: faltas,
      penalidadesTempo: pTempo,
      penalidadesTotais: r2(faltas + pTempo),
      tempoIdeal: ideal,
      diferencaIdeal: r2(Math.abs(tempo - ideal)),
    };
  }

  // tempo_concedido (A ao cronômetro) e tabela_a (A sem cronômetro)
  if (tempo > TC * 2) return elim("Excedeu o tempo limite (2×TC)");
  const pTempo = tempo > TC ? Math.ceil(tempo - TC) * pps : 0;
  return {
    status: "concluido",
    motivoEliminacao: null,
    penalidadesFaltas: faltas,
    penalidadesTempo: pTempo,
    penalidadesTotais: faltas + pTempo,
    tempoIdeal: null,
    diferencaIdeal: null,
  };
}

export interface LinhaClassificavel {
  status: StatusPercurso | "aguardando";
  penalidadesTotais: number;
  tempoMs: number;
  diferencaIdeal: number | null;
  ordemEntrada: number;
}

/**
 * Classifica um percurso de salto:
 *  - concluídos primeiro, depois eliminados, depois quem ainda não correu;
 *  - tempo_ideal/faixa: menor diferença ao ideal (com desempate ao ideal);
 *  - com cronômetro: menor penalidade, depois menor tempo;
 *  - sem cronômetro (tabela_a): só penalidade; empatados mantêm a ordem de entrada.
 */
export function classificarSalto<T extends LinhaClassificavel>(itens: T[], tipo: BaremoTipo): T[] {
  const peso = (s: T["status"]) => (s === "concluido" ? 0 : s === "eliminado" ? 1 : 2);
  return [...itens].sort((a, b) => {
    const p = peso(a.status) - peso(b.status);
    if (p) return p;
    if (a.status !== "concluido") return a.ordemEntrada - b.ordemEntrada;

    if (tipo === "tempo_ideal") {
      const d = (a.diferencaIdeal ?? Infinity) - (b.diferencaIdeal ?? Infinity);
      return d || a.ordemEntrada - b.ordemEntrada;
    }
    const dp = a.penalidadesTotais - b.penalidadesTotais;
    if (dp) return dp;
    if (tipo === "faixa_tempo") {
      const d = (a.diferencaIdeal ?? Infinity) - (b.diferencaIdeal ?? Infinity);
      return d || a.ordemEntrada - b.ordemEntrada;
    }
    if (tipo === "tabela_a") return a.ordemEntrada - b.ordemEntrada; // sem cronômetro: tempo não desempata
    const dt = a.tempoMs - b.tempoMs;
    return dt || a.ordemEntrada - b.ordemEntrada;
  });
}
