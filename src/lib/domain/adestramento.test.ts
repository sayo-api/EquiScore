import { describe, expect, it } from "vitest";
import catalogo from "@/data/reprises.json";
import {
  apurarFolha,
  classificar,
  consolidarJuizes,
  deducaoPorErros,
  pontuacaoMaxima,
  type FolhaDoJuiz,
  type Reprise,
} from "./adestramento";

const reprises = catalogo as Reprise[];
const preliminar3 = reprises.find((r) => r.nome === "Série Preliminar nº 03 (2023)")!;

function folhaComNota(r: Reprise, nota: number, extra: Partial<FolhaDoJuiz> = {}): FolhaDoJuiz {
  return {
    juizLetra: "C",
    status: "FINALIZADO",
    errosPercurso: 0,
    notasPista: r.movimentos.map((m) => ({ num: m.num, nota })),
    notasConjunto: r.notasConjunto.map((c) => ({ num: c.num, nota })),
    ...extra,
  };
}

describe("catálogo de reprises", () => {
  it("tem as 21 reprises oficiais, todas coerentes com o máximo de pontos", () => {
    expect(reprises).toHaveLength(21);
    for (const r of reprises) {
      expect(pontuacaoMaxima(r), r.nome).toBe(r.pontuacaoMaxima);
      expect(r.movimentos.map((m) => m.num), r.nome).toEqual(r.movimentos.map((_, i) => i + 1));
    }
  });
});

describe("apuração de uma folha", () => {
  it("nota 10 em tudo dá 100%", () => {
    expect(apurarFolha(preliminar3, folhaComNota(preliminar3, 10)).percentual).toBe(100);
  });

  it("aplica o coeficiente de cada movimento", () => {
    const r = apurarFolha(preliminar3, folhaComNota(preliminar3, 5));
    expect(r.pontuacaoBruta).toBe(preliminar3.pontuacaoMaxima / 2);
    expect(r.percentual).toBe(50);
  });

  it("desconta erros de percurso: 2, depois 6, e o 3º elimina", () => {
    expect(deducaoPorErros(0)).toBe(0);
    expect(deducaoPorErros(1)).toBe(2);
    expect(deducaoPorErros(2)).toBe(6);
    const r = apurarFolha(preliminar3, folhaComNota(preliminar3, 10, { errosPercurso: 1 }));
    expect(r.pontuacaoLiquida).toBe(preliminar3.pontuacaoMaxima - 2);
    expect(apurarFolha(preliminar3, folhaComNota(preliminar3, 10, { errosPercurso: 3 })).eliminadoPorErros).toBe(true);
  });

  it("ignora notas ainda não lançadas", () => {
    const folha = folhaComNota(preliminar3, 10);
    folha.notasPista[0].nota = null;
    const coef1 = preliminar3.movimentos[0].coeficiente;
    expect(apurarFolha(preliminar3, folha).pontuacaoBruta).toBe(preliminar3.pontuacaoMaxima - 10 * coef1);
  });
});

describe("consolidação dos juízes", () => {
  it("nota final é a média dos juízes com nota", () => {
    const r = consolidarJuizes(preliminar3, [
      folhaComNota(preliminar3, 6, { juizLetra: "C" }),
      folhaComNota(preliminar3, 8, { juizLetra: "B" }),
    ]);
    expect(r.status).toBe("FINALIZADO");
    expect(r.percentual).toBe(70);
  });

  it("um juiz ainda julgando deixa o conjunto em andamento", () => {
    const r = consolidarJuizes(preliminar3, [
      folhaComNota(preliminar3, 6, { juizLetra: "C" }),
      folhaComNota(preliminar3, 8, { juizLetra: "B", status: "EM_ANDAMENTO" }),
    ]);
    expect(r.status).toBe("EM_ANDAMENTO");
  });

  it("3 erros de percurso eliminam o conjunto", () => {
    const r = consolidarJuizes(preliminar3, [folhaComNota(preliminar3, 9, { errosPercurso: 3 })]);
    expect(r.status).toBe("ELIMINADO");
  });
});

describe("classificação", () => {
  it("finalizados por percentual; o resto pela ordem de entrada", () => {
    const lista = classificar([
      { id: "a", status: "AGUARDANDO" as const, percentual: 0, ordemEntrada: 1 },
      { id: "b", status: "FINALIZADO" as const, percentual: 61, ordemEntrada: 2 },
      { id: "c", status: "FINALIZADO" as const, percentual: 68.5, ordemEntrada: 3 },
      { id: "d", status: "ELIMINADO" as const, percentual: 0, ordemEntrada: 4 },
    ]);
    expect(lista.map((x) => x.id)).toEqual(["c", "b", "d", "a"]);
  });
});
