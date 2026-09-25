/**
 * Ordem de entrada: agrupada por reprise (padrão) ou mesclada (fila única).
 * O sorteio deixa pelo menos GAP conjuntos entre as montarias da mesma pessoa,
 * dando tempo para trocar de cavalo. Sem campeonato/dias.
 */
export const GAP = 4;

export interface Conjunto {
  id: string;
  nome: string;
  chaveReprise: string; // repriseId (adestramento) ou categoria (salto)
}

const embaralhar = <T>(a: T[]): T[] => {
  const r = a.slice();
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

/**
 * Sorteia um grupo por rodadas: cada montaria de um cavaleiro entra numa rodada
 * diferente, com os cavaleiros de mais de uma montaria à frente. Assim as
 * montarias da mesma pessoa ficam espaçadas por ~(nº de cavaleiros do grupo).
 */
export function sortearGrupo(lista: Conjunto[]): Conjunto[] {
  const por = new Map<string, Conjunto[]>();
  for (const c of lista) (por.get(c.nome) ?? por.set(c.nome, []).get(c.nome)!).push(c);
  const multi = embaralhar([...por.values()].filter((g) => g.length > 1));
  const singles = embaralhar([...por.values()].filter((g) => g.length === 1));
  const maxRod = Math.max(0, ...[...por.values()].map((g) => g.length));
  const res: Conjunto[] = [];
  for (let r = 0; r < maxRod; r++) {
    for (const g of multi) if (g[r]) res.push(g[r]);
    if (r === 0) for (const g of singles) res.push(g[0]);
  }
  return res;
}

/**
 * Sorteia a ordem completa.
 * @param ordemReprises ordem das reprises quando agrupado.
 */
export function sortear(lista: Conjunto[], mesclar: boolean, ordemReprises: string[]): Conjunto[] {
  if (mesclar) return sortearGrupo(lista);
  return ordemReprises.flatMap((k) => sortearGrupo(lista.filter((c) => c.chaveReprise === k)));
}

/** Ordena para exibição: agrupado segue a ordem das reprises; mesclado usa a ordem gravada. */
export function ordenar<T extends { chaveReprise: string; ordemEntrada: number }>(
  itens: T[],
  mesclar: boolean,
  ordemReprises: string[],
): T[] {
  if (mesclar) return [...itens].sort((a, b) => a.ordemEntrada - b.ordemEntrada);
  const pos = (k: string) => {
    const i = ordemReprises.indexOf(k);
    return i < 0 ? 999 : i;
  };
  return [...itens].sort((a, b) => pos(a.chaveReprise) - pos(b.chaveReprise) || a.ordemEntrada - b.ordemEntrada);
}

/** Índices (0-based) que montam de novo com menos de GAP conjuntos no meio. */
export function avisosDeGap(nomesEmOrdem: string[]): Set<number> {
  const avisos = new Set<number>();
  for (let i = 0; i < nomesEmOrdem.length; i++) {
    for (let j = Math.max(0, i - GAP); j < i; j++) {
      if (nomesEmOrdem[j] === nomesEmOrdem[i]) avisos.add(i);
    }
  }
  return avisos;
}
