import "server-only";
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/*
 * Modelos compatíveis com as coleções do SAHDI (admins, provas, cavaleiros,
 * reprises). strict: false preserva campos que o EquiScore ainda não usa,
 * para nunca apagar dados do sistema antigo ao salvar.
 */
const opts = { strict: false } as const;

const adminSchema = new Schema(
  {
    username: { type: String, unique: true },
    password: String,
    nome: String,
    role: { type: String, default: "ADMIN" },
  },
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
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
  },
  opts,
);

const cavaleiroSchema = new Schema(
  {
    nome: { type: String, required: true },
    cavalo: { type: String, required: true },
    postoGraduacao: { type: String, required: true },
    categoria: { type: String, default: "Geral" },
    provaId: { type: Schema.Types.ObjectId, ref: "Prova", index: true },
    repriseId: { type: Schema.Types.ObjectId, ref: "Reprise", default: null },
    ownerId: { type: Schema.Types.ObjectId, ref: "Admin", index: true },
    ordemEntrada: { type: Number, default: 0 },
    status: { type: String, default: "AGUARDANDO" },
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

function modelo<T extends Schema>(nome: string, schema: T) {
  return (mongoose.models[nome] as Model<InferSchemaType<T>>) ?? mongoose.model(nome, schema);
}

export const Admin = modelo("Admin", adminSchema);
export const Prova = modelo("Prova", provaSchema);
export const Cavaleiro = modelo("Cavaleiro", cavaleiroSchema);
export const Reprise = modelo("Reprise", repriseSchema);
