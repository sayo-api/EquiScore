import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- schemas strict:false, modelos tipados como Model<any> de propósito */
import mongoose, { Schema, type Model } from "mongoose";

/*
 * Modelos do EquiScore. strict:false preserva campos gravados por outra versão
 * e nunca apaga dados ao salvar.
 */
const opts = { strict: false, timestamps: true } as const;

const adminSchema = new Schema(
  { username: { type: String, unique: true }, password: String, nome: String, role: { type: String, default: "ADMIN" } },
  opts,
);

const provaSchema = new Schema(
  {
    nome: { type: String, required: true },
    local: { type: String, default: "" },
    data: { type: Date, default: null },
    tipo: { type: String, default: "ADESTRAMENTO" },
    status: { type: String, default: "ATIVA" },
    reprises: [{ type: Schema.Types.ObjectId, ref: "Reprise" }],
    numJuizes: { type: Number, default: 1 },
    baremo: { type: String, default: "220.2.1.1" },
    tempoConcedido: { type: Number, default: 80 },
    tempoIdeal: { type: Number, default: null },
    mesclar: { type: Boolean, default: false },
    inicioHorario: { type: String, default: "08:00" },
    minutosPorConjunto: { type: Number, default: 7 },
    cavaleiroEmPista: { type: Schema.Types.ObjectId, ref: "Cavaleiro", default: null },
    intervalos: { type: [{ aposOrdem: Number, minutos: Number, _id: false }], default: [] },
    publicadoEm: { type: Date, default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
  },
  opts,
);

const cavaleiroSchema = new Schema(
  {
    nome: { type: String, required: true },
    nomeCompleto: { type: String, default: "" },
    cavalo: { type: String, required: true },
    postoGraduacao: { type: String, default: "" },
    categoria: { type: String, default: "" },
    cavaloFiliacao: { type: String, default: "" },
    cavaloPai: { type: String, default: "" },
    cavaloMae: { type: String, default: "" },
    tratador: { type: String, default: "" },
    equipe: { type: String, default: "" },
    email: { type: String, default: "" },
    telefone: { type: String, default: "" },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    competidorId: { type: Schema.Types.ObjectId, ref: "Competidor", default: null, index: true },
    repriseId: { type: Schema.Types.ObjectId, ref: "Reprise", default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    ordemEntrada: { type: Number, default: 0 },
    status: { type: String, default: "AGUARDANDO" },
  },
  opts,
);
cavaleiroSchema.index({ provaId: 1, repriseId: 1 });

const avaliacaoSchema = new Schema(
  {
    cavaleiroId: { type: Schema.Types.ObjectId, ref: "Cavaleiro", index: true },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    repriseId: { type: Schema.Types.ObjectId, ref: "Reprise" },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    juizLetra: { type: String, default: "C" },
    notasPista: { type: [{ num: Number, nota: Number, _id: false }], default: [] },
    notasConjunto: { type: [{ num: Number, nota: Number, _id: false }], default: [] },
    errosPercurso: { type: Number, default: 0 },
    status: { type: String, default: "EM_ANDAMENTO" },
  },
  opts,
);
avaliacaoSchema.index({ cavaleiroId: 1, repriseId: 1, juizLetra: 1 }, { unique: true });

const resultadoSaltoSchema = new Schema(
  {
    cavaleiroId: { type: Schema.Types.ObjectId, ref: "Cavaleiro", unique: true },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    tempoMs: { type: Number, default: 0 },
    derrubadas: { type: Number, default: 0 },
    recuos: { type: Number, default: 0 },
    quedaCavalo: { type: Boolean, default: false },
    forfait: { type: Boolean, default: false },
    penalidadesFaltas: { type: Number, default: 0 },
    penalidadesTempo: { type: Number, default: 0 },
    penalidadesTotais: { type: Number, default: 0 },
    diferencaIdeal: { type: Number, default: null },
    status: { type: String, default: "concluido" },
    motivoEliminacao: { type: String, default: null },
  },
  opts,
);

const repriseSchema = new Schema(
  {
    nome: String,
    pontuacaoMaxima: Number,
    qtdMovimentos: Number,
    movimentos: [Schema.Types.Mixed],
    notasConjunto: [Schema.Types.Mixed],
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  opts,
);

const juizSchema = new Schema(
  {
    username: { type: String, unique: true },
    password: String,
    nome: { type: String, default: "Juiz" },
    juizLetra: { type: String, default: "C" },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
  },
  opts,
);
juizSchema.index({ provaId: 1, juizLetra: 1 }, { unique: true });

const competidorSchema = new Schema(
  {
    email: { type: String, unique: true },
    password: String,
    nome: { type: String, default: "" },
    nomeGuerra: { type: String, default: "" },
    postoGraduacao: { type: String, default: "" },
    telefone: { type: String, default: "" },
  },
  opts,
);

const publicacaoSchema = new Schema(
  {
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true, unique: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    tipo: String,
    provaNome: String,
    local: String,
    data: Date,
    publicadoEm: { type: Date, default: Date.now },
    grupos: { type: Schema.Types.Mixed, default: [] },
    pdfUrl: { type: String, default: null },
  },
  opts,
);

const auditoriaSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    autor: { type: String, default: "" },
    acao: { type: String, default: "" },
    resumo: { type: String, default: "" },
  },
  opts,
);

const metaSchema = new Schema({ _id: String, versao: String, em: Date }, { strict: false });

// Schemas usam strict:false e compartilham o banco com o SAHDI; tipar como
// Model<any> mantém as consultas flexíveis (filtros por _id, provaId, etc.).
function modelo(nome: string, schema: Schema): Model<any> {
  return (mongoose.models[nome] as Model<any>) ?? mongoose.model(nome, schema);
}

export const Admin = modelo("Admin", adminSchema);
export const Prova = modelo("Prova", provaSchema);
export const Cavaleiro = modelo("Cavaleiro", cavaleiroSchema);
export const Avaliacao = modelo("Avaliacao", avaliacaoSchema);
export const ResultadoSalto = modelo("ResultadoSalto", resultadoSaltoSchema);
export const Juiz = modelo("Juiz", juizSchema);
export const Competidor = modelo("Competidor", competidorSchema);
export const Reprise = modelo("Reprise", repriseSchema);
export const Publicacao = modelo("Publicacao", publicacaoSchema);
export const Auditoria = modelo("Auditoria", auditoriaSchema);
export const Meta = modelo("Meta", metaSchema);
