/**
 * Cria 2 provas de demonstração no banco do EquiScore:
 *   A) "DEMO — Prova Finalizada"  → 10 conjuntos julgados por 2 juízes,
 *      resultados calculados e PUBLICADOS, prova ENCERRADA.
 *   B) "DEMO — Prova Aberta"      → 10 conjuntos + 2 juízes cadastrados,
 *      sem notas, prova ATIVA (pronta para julgar).
 *
 * Como rodar (na raiz do projeto EquiScore):
 *   node scripts/seed-demo.mjs
 * Usa MONGODB_URI do ambiente ou do arquivo .env.local.
 *
 * Rodar de novo apaga as provas DEMO anteriores e recria (idempotente).
 */
import mongoose from "mongoose";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

// ── URI: env ou .env.local ────────────────────────────────────
let URI = process.env.MONGODB_URI;
if (!URI) {
  try {
    const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    URI = env.split("\n").find((l) => l.startsWith("MONGODB_URI="))?.slice("MONGODB_URI=".length).trim();
  } catch { /* ignora */ }
}
if (!URI) { console.error("Defina MONGODB_URI (no ambiente ou em .env.local)."); process.exit(1); }

const hash = (senha) => { const salt = randomBytes(16).toString("hex"); return `scrypt$${salt}$${scryptSync(String(senha), salt, 64).toString("hex")}`; };
const opts = { strict: false, timestamps: true };
const M = (n) => mongoose.models[n] || mongoose.model(n, new mongoose.Schema({}, opts));

const POSTOS = ["Cel", "Ten Cel", "Maj", "Cap", "1º Ten", "2º Ten", "Sr.", "Sra.", "1º Sgt", "Cb"];
const NOMES = ["Rafael Andrade", "Mariana Costa", "João Pedro Lima", "Beatriz Souza", "CarlosEduardo Rocha",
  "Fernanda Alves", "Gustavo Martins", "Larissa Oliveira", "Bruno Carvalho", "Patrícia Gomes",
  "Ricardo Nunes", "Camila Ferreira", "André Ribeiro", "Juliana Dias", "Marcelo Teixeira",
  "Aline Barbosa", "Thiago Moreira", "Renata Pinto", "Felipe Azevedo", "Vanessa Cardoso"];
const CAVALOS = ["Trovão", "Estrela do Sul", "Relâmpago", "Aurora", "Furacão", "Diamante Negro", "Vento Forte",
  "Lua Cheia", "Imperador", "Pégaso", "Cometa", "Rainha", "Sultão", "Miragem", "Corcel de Ouro",
  "Tempestade", "Faísca", "Nobreza", "Valente", "Sereno"];

function notasReprise(reprise, base) {
  const nota = () => { const v = base + (Math.round(Math.random() * 6) - 3) * 0.5; return Math.max(0, Math.min(10, v)); };
  const notasPista = (reprise.movimentos || []).map((m) => ({ num: m.num, nota: nota() }));
  const notasConjunto = (reprise.notasConjunto || []).map((c) => ({ num: c.num, nota: nota() }));
  let bruta = 0;
  for (const m of reprise.movimentos || []) bruta += (notasPista.find((n) => n.num === m.num)?.nota || 0) * (m.coeficiente || 1);
  for (const c of reprise.notasConjunto || []) bruta += (notasConjunto.find((n) => n.num === c.num)?.nota || 0) * (c.coeficiente || 1);
  const liquida = bruta;
  const pct = reprise.pontuacaoMaxima > 0 ? Math.round((liquida / reprise.pontuacaoMaxima) * 100 * 1000) / 1000 : 0;
  return { notasPista, notasConjunto, pontuacaoBruta: bruta, pontuacaoLiquida: liquida, percentualFinal: pct };
}

const fmtPct = (n) => n.toFixed(3).replace(".", ",") + "%";

async function main() {
  await mongoose.connect(URI);
  console.log("Conectado ao banco.");
  const Admin = M("Admin"), Prova = M("Prova"), Cavaleiro = M("Cavaleiro"),
        Avaliacao = M("Avaliacao"), Juiz = M("Juiz"), Reprise = M("Reprise"), Publicacao = M("Publicacao");

  // Dono: admin fixo sayoz
  let dono = await Admin.findOne({ username: "sayoz" });
  if (!dono) dono = await Admin.create({ username: "sayoz", nome: "sayoz", role: "SUPER", password: hash("34615194") });
  const ownerId = dono._id;
  console.log("Organizador:", dono.username);

  // Reprises (catálogo global)
  const reprises = await Reprise.find({ ownerId: null }).lean();
  if (reprises.length < 2) { console.error("Poucas reprises no banco. Faça o primeiro deploy do app para semear as reprises."); process.exit(1); }
  const repA = reprises.find((r) => /Preliminar n. ?03/.test(r.nome)) || reprises[0];
  const repB = reprises.find((r) => r._id.toString() !== repA._id.toString() && /M.dia/.test(r.nome)) || reprises[1];

  // Limpa DEMOs anteriores
  const antigas = await Prova.find({ nome: /^DEMO —/ }, { _id: 1 }).lean();
  const ids = antigas.map((p) => p._id);
  if (ids.length) {
    await Promise.all([
      Cavaleiro.deleteMany({ provaId: { $in: ids } }), Avaliacao.deleteMany({ provaId: { $in: ids } }),
      Juiz.deleteMany({ provaId: { $in: ids } }), Publicacao.deleteMany({ provaId: { $in: ids } }),
      Prova.deleteMany({ _id: { $in: ids } }),
    ]);
    console.log("Removidas", ids.length, "prova(s) DEMO anteriores.");
  }

  const criarJuizes = async (provaId, sufixo) => {
    const defs = [{ letra: "C", nome: "Juiz C" }, { letra: "B", nome: "Juiz B" }];
    for (const d of defs) {
      await Juiz.create({ username: `demo-${sufixo}-${d.letra.toLowerCase()}`, password: hash("juiz123"),
        nome: d.nome, juizLetra: d.letra, provaId, ownerId });
    }
    return defs;
  };

  const criarConjuntos = (provaId, reprise, offset) =>
    Array.from({ length: 10 }, (_, i) => ({
      nome: NOMES[(offset + i) % NOMES.length], cavalo: CAVALOS[(offset + i) % CAVALOS.length],
      postoGraduacao: POSTOS[(offset + i) % POSTOS.length], categoria: "Geral",
      provaId, ownerId, repriseId: reprise._id, ordemEntrada: i + 1, status: "AGUARDANDO",
    }));

  // ── PROVA A — finalizada e publicada ────────────────────────
  const provaA = await Prova.create({
    nome: "DEMO — Prova Finalizada", local: "Regimento de Cavalaria", data: new Date(),
    tipo: "ADESTRAMENTO", status: "ENCERRADA", reprises: [repA._id], numJuizes: 2, ownerId,
  });
  const juizesA = await criarJuizes(provaA._id, "a");
  const consA = await Cavaleiro.insertMany(criarConjuntos(provaA._id, repA, 0));
  const linhasCalc = [];
  for (const cav of consA) {
    const porLetra = {};
    for (const j of juizesA) {
      const r = notasReprise(repA, 7);
      await Avaliacao.create({ cavaleiroId: cav._id, provaId: provaA._id, repriseId: repA._id, ownerId,
        juizNome: j.nome, juizLetra: j.letra, ...r, errosPercurso: 0, status: "FINALIZADO" });
      porLetra[j.letra] = r.percentualFinal;
    }
    await Cavaleiro.updateOne({ _id: cav._id }, { $set: { status: "FINALIZADO" } });
    const media = Object.values(porLetra).reduce((s, v) => s + v, 0) / juizesA.length;
    linhasCalc.push({ ordemEntrada: cav.ordemEntrada, conjunto: `${cav.postoGraduacao} ${cav.nome}`, cavalo: cav.cavalo, porLetra, media });
  }
  // Classificação + sub-ranking por juiz (igual ao app)
  linhasCalc.sort((a, b) => b.media - a.media);
  const posJuiz = {};
  for (const j of juizesA) {
    const ord = [...linhasCalc].sort((a, b) => (b.porLetra[j.letra] || 0) - (a.porLetra[j.letra] || 0));
    posJuiz[j.letra] = new Map(ord.map((l, i) => [l.ordemEntrada, i + 1]));
  }
  const grupos = [{
    titulo: repA.nome, colunaValor: "%", juizes: juizesA.map((j) => j.letra),
    linhas: linhasCalc.map((l, i) => ({
      posicao: i + 1, ordemEntrada: l.ordemEntrada, conjunto: l.conjunto, cavalo: l.cavalo,
      status: "FINALIZADO", resumo: fmtPct(l.media), eliminado: false,
      porJuiz: juizesA.map((j) => ({ letra: j.letra, valor: fmtPct(l.porLetra[j.letra] || 0), posicao: posJuiz[j.letra].get(l.ordemEntrada) ?? null })),
    })),
  }];
  await Publicacao.create({ provaId: provaA._id, ownerId, tipo: "ADESTRAMENTO", provaNome: provaA.nome,
    local: provaA.local, data: provaA.data, publicadoEm: new Date(), grupos, pdfUrl: null });
  await Prova.updateOne({ _id: provaA._id }, { $set: { publicadoEm: new Date() } });
  console.log("✓ Prova A (finalizada + publicada):", provaA.nome, "— reprise:", repA.nome);

  // ── PROVA B — aberta, só cadastros ──────────────────────────
  const provaB = await Prova.create({
    nome: "DEMO — Prova Aberta", local: "Sociedade Hípica", data: new Date(Date.now() + 7 * 864e5),
    tipo: "ADESTRAMENTO", status: "ATIVA", reprises: [repB._id], numJuizes: 2, ownerId,
  });
  await criarJuizes(provaB._id, "b");
  await Cavaleiro.insertMany(criarConjuntos(provaB._id, repB, 10));
  console.log("✓ Prova B (aberta, sem notas):", provaB.nome, "— reprise:", repB.nome);

  console.log("\nJuízes criados (senha: juiz123):");
  console.log("  Prova A: demo-a-c , demo-a-b");
  console.log("  Prova B: demo-b-c , demo-b-b");
  console.log("\nPronto. Abra o painel do EquiScore para ver as provas DEMO.");
  await mongoose.disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
