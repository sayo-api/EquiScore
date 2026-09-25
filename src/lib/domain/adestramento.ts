/**
 * Regras de apuração do adestramento (CBH).
 *
 * Funções puras, sem banco nem framework: são o coração do sistema e por isso
 * ficam isoladas e cobertas por testes. As regras são as mesmas do SAHDI, para
 * que os dois sistemas deem exatamente o mesmo resultado sobre os mesmos dados.
 */

export interface Movimento {
  num: number;
  local: string;
  descricao: string;
  diretrizes: string;
  coeficiente: number;
}

export interface NotaDeConjunto {
  num: number;
  descricao: string;
  diretrizes: string;
  coeficiente: number;
}

export interface Reprise {
  nome: string;
  pontuacaoMaxima: number;
  qtdMovimentos: number;
  movimentos: Movimento[];
  notasConjunto: NotaDeConjunto[];
}

/** Nota dada por um juiz a um movimento ou nota de conjunto (0 a 10, meio ponto). */
export interface NotaLancada {
  num: number;
  nota: number | null;
}

export type StatusAvaliacao = "AGUARDANDO" | "EM_ANDAMENTO" | "FINALIZADO" | "ELIMINADO";

export interface FolhaDoJuiz {
  juizLetra: string;
  notasPista: NotaLancada[];
  notasConjunto: NotaLancada[];
  errosPercurso: number;
  status: StatusAvaliacao;
}

export interface ResultadoDoJuiz {
  pontuacaoBruta: number;
  deducao: number;
  pontuacaoLiquida: number;
  /** Percentual com 3 casas, como na folha oficial. */
  percentual: number;
  /** 3 erros de percurso = eliminação. */
  eliminadoPorErros: boolean;
}

/** Soma dos coeficientes × 10. Deve bater com o "máximo de pontos" da folha. */
export function pontuacaoMaxima(r: Pick<Reprise, "movimentos" | "notasConjunto">): number {
  const soma = [...r.movimentos, ...r.notasConjunto].reduce((s, m) => s + (m.coeficiente || 1), 0);
  return soma * 10;
}

/** Dedução por erros de percurso: 1º = 2 pts, 2º = +4 (total 6), 3º = eliminação. */
export function deducaoPorErros(erros: number): number {
  if (erros <= 0) return 0;
  if (erros === 1) return 2;
  return 6;
}

const arred3 = (n: number) => Math.round(n * 1000) / 1000;

export function apurarFolha(reprise: Reprise, folha: Omit<FolhaDoJuiz, "juizLetra" | "status">): ResultadoDoJuiz {
  const coef = (lista: { num: number; coeficiente: number }[], num: number) =>
    lista.find((m) => m.num === num)?.coeficiente ?? 0;

  let bruta = 0;
  for (const n of folha.notasPista) if (n.nota != null) bruta += n.nota * coef(reprise.movimentos, n.num);
  for (const n of folha.notasConjunto) if (n.nota != null) bruta += n.nota * coef(reprise.notasConjunto, n.num);

  const deducao = deducaoPorErros(folha.errosPercurso);
  const liquida = Math.max(0, bruta - deducao);
  return {
    pontuacaoBruta: bruta,
    deducao,
    pontuacaoLiquida: liquida,
    percentual: reprise.pontuacaoMaxima > 0 ? arred3((liquida / reprise.pontuacaoMaxima) * 100) : 0,
    eliminadoPorErros: folha.errosPercurso >= 3,
  };
}

export interface ResultadoDoConjunto {
  status: StatusAvaliacao;
  /** Média dos percentuais dos juízes que já lançaram nota. */
  percentual: number;
  pontuacaoLiquida: number;
  porJuiz: Record<string, ResultadoDoJuiz & { status: StatusAvaliacao }>;
}

/**
 * Consolida as folhas de todos os juízes de um conjunto.
 * Nota final = soma dos percentuais ÷ nº de juízes com nota (1 juiz → a própria nota).
 */
export function consolidarJuizes(reprise: Reprise, folhas: FolhaDoJuiz[]): ResultadoDoConjunto {
  const porJuiz: ResultadoDoConjunto["porJuiz"] = {};
  for (const f of folhas) porJuiz[f.juizLetra] = { ...apurarFolha(reprise, f), status: f.status };

  const lista = Object.values(porJuiz);
  let status: StatusAvaliacao = "AGUARDANDO";
  if (lista.some((j) => j.status === "ELIMINADO" || j.eliminadoPorErros)) status = "ELIMINADO";
  else if (lista.length && lista.every((j) => j.status === "FINALIZADO")) status = "FINALIZADO";
  else if (lista.some((j) => j.status === "EM_ANDAMENTO" || j.status === "FINALIZADO")) status = "EM_ANDAMENTO";

  const comNota = lista.filter((j) => j.status === "FINALIZADO" || j.status === "EM_ANDAMENTO");
  const media = (k: "percentual" | "pontuacaoLiquida") =>
    comNota.length ? comNota.reduce((s, j) => s + j[k], 0) / comNota.length : 0;

  return {
    status,
    percentual: arred3(media("percentual")),
    pontuacaoLiquida: Math.round(media("pontuacaoLiquida") * 10) / 10,
    porJuiz,
  };
}

const PESO_STATUS: Record<StatusAvaliacao, number> = { FINALIZADO: 0, ELIMINADO: 1, EM_ANDAMENTO: 2, AGUARDANDO: 3 };

/** Classificação: finalizados pelo maior percentual; depois eliminados, em andamento e aguardando (na ordem de entrada). */
export function classificar<T extends { status: StatusAvaliacao; percentual: number; ordemEntrada: number }>(itens: T[]): T[] {
  return [...itens].sort((a, b) => {
    const d = PESO_STATUS[a.status] - PESO_STATUS[b.status];
    if (d) return d;
    if (a.status === "FINALIZADO") return b.percentual - a.percentual;
    return a.ordemEntrada - b.ordemEntrada;
  });
}
