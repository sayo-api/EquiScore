import { describe, expect, it } from "vitest";
import { BAREMOS, calcularPercurso, classificarSalto, temposAuto, type PercursoEntrada } from "./salto";

const base = (o: Partial<PercursoEntrada>): PercursoEntrada => ({
  tipo: "tempo_concedido",
  tempoMs: 70_000,
  tempoConcedido: 80,
  ...o,
});

describe("tempos automáticos", () => {
  it("tempo concedido = ceil(distância×60/velocidade); ideal 95%; limite 2×", () => {
    expect(temposAuto(500, 350)).toEqual({ tempoConcedido: 86, tempoIdeal: 82, tempoLimite: 172 });
    expect(temposAuto(0, 350)).toBeNull();
  });
});

describe("Tabela A ao cronômetro", () => {
  it("percurso limpo no tempo: zero", () => {
    expect(calcularPercurso(base({})).penalidadesTotais).toBe(0);
  });
  it("duas derrubadas = 8", () => {
    expect(calcularPercurso(base({ derrubadas: 2 })).penalidadesTotais).toBe(8);
  });
  it("1 ponto por segundo (ou fração) acima do tempo concedido", () => {
    expect(calcularPercurso(base({ tempoMs: 83_200, tempoConcedido: 80 })).penalidadesTempo).toBe(4);
  });
  it("uma recusa penaliza; a segunda elimina", () => {
    expect(calcularPercurso(base({ recuos: 1 })).penalidadesTotais).toBe(4);
    const el = calcularPercurso(base({ recuos: 2 }));
    expect(el.status).toBe("eliminado");
  });
  it("queda e forfait eliminam; exceder 2×TC elimina", () => {
    expect(calcularPercurso(base({ quedaCavalo: true })).status).toBe("eliminado");
    expect(calcularPercurso(base({ forfait: true })).status).toBe("eliminado");
    expect(calcularPercurso(base({ tempoMs: 161_000, tempoConcedido: 80 })).status).toBe("eliminado");
  });
});

describe("Tabela C", () => {
  it("cada derrubada vira segundos somados ao tempo", () => {
    const r = calcularPercurso(base({ tipo: "tabela_c", tempoMs: 60_000, tempoConcedido: 120, derrubadas: 2 }));
    expect(r.penalidadesTotais).toBe(68); // 60s + 2×4s
  });
});

describe("tempo ideal", () => {
  it("mede a diferença até o ideal, sem penalidade de tempo", () => {
    const r = calcularPercurso(base({ tipo: "tempo_ideal", tempoMs: 78_000, tempoConcedido: 80, tempoIdeal: 76 }));
    expect(r.penalidadesTempo).toBe(0);
    expect(r.diferencaIdeal).toBe(2);
  });
});

describe("classificação", () => {
  const linha = (o: Partial<Parameters<typeof classificarSalto>[0][number]>) => ({
    status: "concluido" as const,
    penalidadesTotais: 0,
    tempoMs: 0,
    diferencaIdeal: null,
    ordemEntrada: 0,
    ...o,
  });

  it("ao cronômetro: menor penalidade, depois menor tempo; eliminados no fim", () => {
    const r = classificarSalto(
      [
        linha({ penalidadesTotais: 4, tempoMs: 70_000, ordemEntrada: 1 }),
        linha({ penalidadesTotais: 0, tempoMs: 75_000, ordemEntrada: 2 }),
        linha({ penalidadesTotais: 0, tempoMs: 72_000, ordemEntrada: 3 }),
        linha({ status: "eliminado", ordemEntrada: 4 }),
      ],
      "tempo_concedido",
    );
    expect(r.map((x) => x.ordemEntrada)).toEqual([3, 2, 1, 4]);
  });

  it("sem cronômetro: mesma penalidade mantém a ordem de entrada (tempo não desempata)", () => {
    const r = classificarSalto(
      [
        linha({ penalidadesTotais: 0, tempoMs: 90_000, ordemEntrada: 5 }),
        linha({ penalidadesTotais: 0, tempoMs: 60_000, ordemEntrada: 2 }),
      ],
      "tabela_a",
    );
    expect(r.map((x) => x.ordemEntrada)).toEqual([2, 5]);
  });

  it("tempo ideal: menor diferença vence", () => {
    const r = classificarSalto(
      [
        linha({ diferencaIdeal: 3.2, ordemEntrada: 1 }),
        linha({ diferencaIdeal: 0.4, ordemEntrada: 2 }),
        linha({ diferencaIdeal: 1.1, ordemEntrada: 3 }),
      ],
      "tempo_ideal",
    );
    expect(r.map((x) => x.ordemEntrada)).toEqual([2, 3, 1]);
  });
});

describe("catálogo de baremos", () => {
  it("oferece só provas tradicionais de uma volta (sem equipes/campeonato)", () => {
    expect(BAREMOS.map((b) => b.tipo).sort()).toEqual(
      ["faixa_tempo", "tabela_a", "tabela_c", "tempo_concedido", "tempo_ideal"].sort(),
    );
  });
});
