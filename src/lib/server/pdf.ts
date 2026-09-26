import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { GrupoResultado } from "@/lib/domain/resultados";

const VERM = rgb(0.757, 0.071, 0.122);
const INK = rgb(0.09, 0.09, 0.1);
const MUT = rgb(0.42, 0.42, 0.46);
const LINE = rgb(0.85, 0.85, 0.87);

interface Opcoes {
  provaNome: string;
  local?: string;
  data?: Date | null;
  grupos: GrupoResultado[];
}

/** Boletim de resultados em PDF (A4, padrão EquiScore). Latin-1 (Helvetica). */
export async function gerarPdfResultados(o: Opcoes): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4 = { w: 595.28, h: 841.89 };
  const M = 40;
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  const w = A4.w - M * 2;

  const clean = (s: string) => s.replace(/[^\x20-\xff]/g, "");
  const txt = (s: string, x: number, yy: number, size: number, f = font, color = INK) =>
    page.drawText(clean(s), { x, y: yy, size, font: f, color });
  const nova = () => {
    page = doc.addPage([A4.w, A4.h]);
    y = A4.h - M;
  };
  const espaco = (h: number) => {
    if (y - h < M + 30) nova();
  };

  // Cabeçalho
  page.drawRectangle({ x: M, y: y - 34, width: w, height: 34, color: VERM });
  txt("EquiScore", M + 12, y - 23, 16, bold, rgb(1, 1, 1));
  txt("EQS", M + 92, y - 22, 9, bold, rgb(1, 1, 1));
  txt("BOLETIM DE RESULTADOS", A4.w - M - 150, y - 22, 9, bold, rgb(1, 1, 1));
  y -= 50;
  txt(o.provaNome, M, y, 15, bold);
  y -= 16;
  const sub = [o.local, o.data ? new Date(o.data).toLocaleDateString("pt-BR") : ""].filter(Boolean).join("  ·  ");
  if (sub) { txt(sub, M, y, 10, font, MUT); y -= 6; }
  y -= 12;

  for (const g of o.grupos) {
    espaco(50);
    page.drawRectangle({ x: M, y: y - 18, width: w, height: 18, color: rgb(0.96, 0.93, 0.93) });
    txt(g.titulo.toUpperCase(), M + 8, y - 13, 9.5, bold, VERM);
    y -= 26;

    const juizes = g.juizes || [];
    const cPos = M, cConj = M + 34;

    if (juizes.length) {
      // Layout com colunas por juiz + média (estilo boletim FEI).
      const cMedia = A4.w - M - 48;
      const areaIni = M + 170;
      const areaFim = cMedia - 12;
      const passo = juizes.length ? (areaFim - areaIni) / juizes.length : 0;
      const colJuiz = (i: number) => areaIni + passo * i;
      const cabecalho = () => {
        txt("Col.", cPos, y, 8, bold, MUT);
        txt("Conjunto", cConj, y, 8, bold, MUT);
        juizes.forEach((l, i) => txt("Juiz " + l, colJuiz(i), y, 8, bold, MUT));
        txt("Media", cMedia, y, 8, bold, MUT);
        y -= 4;
        page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.7, color: LINE });
        y -= 14;
      };
      cabecalho();
      for (const l of g.linhas) {
        if (y - 24 < M + 30) { nova(); cabecalho(); }
        txt(l.posicao ? `${l.posicao}º` : "—", cPos, y, 9.5, bold, l.posicao ? INK : MUT);
        txt(l.conjunto, cConj, y, 9, bold);
        txt(l.cavalo, cConj, y - 10, 8, font, MUT);
        (l.porJuiz || []).forEach((j, i) => {
          const rotulo = j.valor + (j.posicao != null ? ` (${j.posicao})` : "");
          txt(rotulo, colJuiz(i), y, 8.5, font, j.valor === "EL" ? VERM : INK);
        });
        txt(l.resumo, cMedia, y, 9.5, l.eliminado ? bold : bold, l.eliminado ? VERM : INK);
        y -= 22;
        page.drawLine({ start: { x: M, y: y + 6 }, end: { x: A4.w - M, y: y + 6 }, thickness: 0.4, color: LINE });
      }
      y -= 8;
      continue;
    }

    // colunas (lista simples)
    const cVal = A4.w - M - 90;
    txt("Col.", cPos, y, 8, bold, MUT);
    txt("Conjunto", cConj, y, 8, bold, MUT);
    txt(g.colunaValor, cVal, y, 8, bold, MUT);
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.7, color: LINE });
    y -= 14;
    for (const l of g.linhas) {
      espaco(30);
      txt(l.posicao ? `${l.posicao}º` : "—", cPos, y, 9.5, bold, l.posicao ? INK : MUT);
      txt(`${l.conjunto}`, cConj, y, 9.5, bold);
      txt(l.cavalo, cConj, y - 11, 8.5, font, MUT);
      txt(l.resumo, cVal, y, 9.5, l.eliminado ? bold : font, l.eliminado ? VERM : INK);
      y -= 22;
      page.drawLine({ start: { x: M, y: y + 6 }, end: { x: A4.w - M, y: y + 6 }, thickness: 0.4, color: LINE });
    }
    y -= 8;
  }

  // Rodapé em todas as páginas
  const n = doc.getPageCount();
  doc.getPages().forEach((p, i) => {
    p.drawText(clean(`EquiScore · ${new Date().toLocaleString("pt-BR")} · página ${i + 1}/${n}`), {
      x: M, y: 24, size: 7.5, font, color: MUT,
    });
  });
  return doc.save();
}

export interface LinhaOrdem {
  pos: number;
  hora: string;
  conjunto: string;
  cavalo: string;
  rotulo: string; // reprise/categoria
  intervaloMin?: number; // pausa após este conjunto
}
interface OpcoesOrdem {
  provaNome: string;
  local?: string;
  data?: Date | null;
  inicio: string;
  minutos: number;
  mesclar: boolean;
  linhas: LinhaOrdem[];
}

/** PDF da ordem de entrada (start list) com horários e intervalos. */
export async function gerarPdfOrdem(o: OpcoesOrdem): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const A4 = { w: 595.28, h: 841.89 };
  const M = 40;
  let page = doc.addPage([A4.w, A4.h]);
  let y = A4.h - M;
  const w = A4.w - M * 2;
  const clean = (s: string) => s.replace(/[^\x20-\xff]/g, "");
  const txt = (s: string, x: number, yy: number, size: number, f = font, color = INK) => page.drawText(clean(s), { x, y: yy, size, font: f, color });
  const nova = () => { page = doc.addPage([A4.w, A4.h]); y = A4.h - M; };

  page.drawRectangle({ x: M, y: y - 34, width: w, height: 34, color: VERM });
  txt("EquiScore", M + 12, y - 23, 16, bold, rgb(1, 1, 1));
  txt("EQS", M + 92, y - 22, 9, bold, rgb(1, 1, 1));
  txt("ORDEM DE ENTRADA", A4.w - M - 128, y - 22, 9, bold, rgb(1, 1, 1));
  y -= 50;
  txt(o.provaNome, M, y, 15, bold);
  y -= 16;
  const sub = [o.local, o.data ? new Date(o.data).toLocaleDateString("pt-BR") : "", `Início ${o.inicio}`, `${o.minutos} min/conjunto`].filter(Boolean).join("  ·  ");
  if (sub) { txt(sub, M, y, 10, font, MUT); }
  y -= 22;

  const cPos = M, cHora = M + 34, cConj = M + 84;
  let rotAtual = "";
  const cabecalho = () => {
    txt("Nº", cPos, y, 8, bold, MUT);
    txt("Hora", cHora, y, 8, bold, MUT);
    txt("Conjunto", cConj, y, 8, bold, MUT);
    y -= 4;
    page.drawLine({ start: { x: M, y }, end: { x: A4.w - M, y }, thickness: 0.7, color: LINE });
    y -= 14;
  };
  cabecalho();

  for (const l of o.linhas) {
    if (!o.mesclar && l.rotulo !== rotAtual) {
      rotAtual = l.rotulo;
      if (y - 24 < M + 30) { nova(); }
      y -= 4;
      page.drawRectangle({ x: M, y: y - 14, width: w, height: 14, color: rgb(0.96, 0.93, 0.93) });
      txt(rotAtual.toUpperCase(), M + 6, y - 10, 8.5, bold, VERM);
      y -= 22;
    }
    if (y - 22 < M + 30) { nova(); cabecalho(); }
    txt(String(l.pos), cPos, y, 9.5, bold, VERM);
    txt(l.hora, cHora, y, 9.5, font, MUT);
    txt(l.conjunto, cConj, y, 9.5, bold);
    if (o.mesclar && l.rotulo) txt(l.rotulo, A4.w - M - 120, y, 8, font, MUT);
    txt(l.cavalo, cConj, y - 10, 8.5, font, MUT);
    y -= 22;
    page.drawLine({ start: { x: M, y: y + 6 }, end: { x: A4.w - M, y: y + 6 }, thickness: 0.4, color: LINE });
    if (l.intervaloMin) {
      if (y - 18 < M + 30) { nova(); }
      page.drawRectangle({ x: M, y: y - 12, width: w, height: 14, color: rgb(0.99, 0.95, 0.86) });
      txt(`Intervalo de ${l.intervaloMin} min`, cConj, y - 8, 8.5, bold, rgb(0.54, 0.35, 0));
      y -= 22;
    }
  }

  const n = doc.getPageCount();
  doc.getPages().forEach((p, i) => {
    p.drawText(clean(`EquiScore · ${new Date().toLocaleString("pt-BR")} · página ${i + 1}/${n}`), { x: M, y: 24, size: 7.5, font, color: MUT });
  });
  return doc.save();
}
