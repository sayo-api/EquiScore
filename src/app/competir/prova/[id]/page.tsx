import Link from "next/link";
import { notFound } from "next/navigation";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Competidor, Prova, Reprise } from "@/lib/server/models";
import { exigirComp } from "@/lib/server/sessao";
import { IconVoltar } from "@/lib/icons";
import { FormInscricaoComp } from "./form";

const fmtData = (d: unknown) => (d ? new Date(d as string).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "");

export default async function InscreverProva({ params }: PageProps<"/competir/prova/[id]">) {
  const { id } = await params;
  const s = await exigirComp();
  if (!Types.ObjectId.isValid(id)) notFound();
  await conectar();
  const prova = await Prova.findById(id).lean<Record<string, unknown>>();
  if (!prova) notFound();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  const perfil = await Competidor.findById(s.compId).lean<Record<string, unknown>>();

  return (
    <div className="mx-auto w-full max-w-md eqs-in">
      <Link href="/competir" className="inline-flex items-center gap-1 text-sm text-mut transition hover:text-red"><IconVoltar width={16} height={16} /> Voltar</Link>
      <div className="mt-2 mb-5">
        <span className="inline-flex rounded-full bg-redwash px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red6">{prova.tipo === "SALTO" ? "Salto" : "Adestramento"}</span>
        <h1 className="mt-1 text-2xl font-black">{String(prova.nome)}</h1>
        <p className="text-sm text-mut">{[String(prova.local || ""), fmtData(prova.data)].filter(Boolean).join(" · ")}</p>
      </div>
      {prova.status !== "ATIVA" ? (
        <p className="rounded-xl border border-line bg-surf p-6 text-center text-mut shadow-sm">As inscrições desta prova estão encerradas.</p>
      ) : (
        <FormInscricaoComp
          provaId={id}
          tipo={String(prova.tipo)}
          reprises={reprises.map((r) => ({ id: String(r._id), nome: String(r.nome) }))}
          perfil={{ nome: String(perfil?.nome || s.nome || ""), postoGraduacao: String(perfil?.postoGraduacao || ""), telefone: String(perfil?.telefone || ""), email: String(perfil?.email || s.email || "") }}
        />
      )}
    </div>
  );
}
