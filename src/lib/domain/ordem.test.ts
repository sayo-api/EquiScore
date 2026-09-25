import { describe, expect, it } from "vitest";
import { avisosDeGap, GAP, ordenar, sortear, type Conjunto } from "./ordem";

const conj = (id: string, nome: string, r: string): Conjunto => ({ id, nome, chaveReprise: r });

describe("sorteio da ordem de entrada", () => {
  it("agrupado mantém a ordem das reprises", () => {
    const l = [conj("1", "A", "r2"), conj("2", "B", "r1"), conj("3", "C", "r2")];
    const r = sortear(l, false, ["r1", "r2"]);
    expect(r[0].chaveReprise).toBe("r1");
    expect(r.slice(1).every((c) => c.chaveReprise === "r2")).toBe(true);
  });

  it("deixa pelo menos GAP conjuntos entre montarias da mesma pessoa", () => {
    const l = [
      conj("1", "Igor", "r1"), conj("2", "Igor", "r1"),
      conj("3", "B", "r1"), conj("4", "C", "r1"), conj("5", "D", "r1"),
      conj("6", "E", "r1"), conj("7", "F", "r1"),
    ];
    for (let t = 0; t < 40; t++) {
      const nomes = sortear(l, true, ["r1"]).map((c) => c.nome);
      const i1 = nomes.indexOf("Igor");
      const i2 = nomes.lastIndexOf("Igor");
      expect(i2 - i1).toBeGreaterThanOrEqual(GAP + 1);
    }
  });
});

describe("avisos de gap", () => {
  it("aponta quem volta cedo demais", () => {
    expect([...avisosDeGap(["Igor", "B", "Igor"])]).toEqual([2]);
    expect(avisosDeGap(["Igor", "B", "C", "D", "E", "Igor"]).size).toBe(0);
  });
});

describe("ordenação para exibição", () => {
  it("mesclado usa a ordem de entrada gravada", () => {
    const itens = [
      { chaveReprise: "r2", ordemEntrada: 1 },
      { chaveReprise: "r1", ordemEntrada: 2 },
    ];
    expect(ordenar(itens, true, ["r1", "r2"]).map((x) => x.ordemEntrada)).toEqual([1, 2]);
  });
});
