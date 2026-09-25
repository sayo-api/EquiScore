import { notFound } from "next/navigation";
import Image from "next/image";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Prova, Reprise } from "@/lib/server/models";
import { FormInscricaoPublica } from "./form";

export default async function InscricaoPublica({ params }: PageProps<"/inscricao/[provaId]">) {
  const { provaId } = await params;
  if (!Types.ObjectId.isValid(provaId)) notFound();
  await conectar();
  const prova = await Prova.findById(provaId).lean<Record<string, unknown>>();
  if (!prova) notFound();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10 eqs-in">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image src="/brand/escudo-512.png" alt="" width={56} height={56} priority />
        <h1 className="mt-3 text-xl font-black">{String(prova.nome)}</h1>
        <p className="text-sm text-mut">Inscrição · {prova.tipo === "SALTO" ? "Salto" : "Adestramento"}</p>
      </div>
      {prova.status !== "ATIVA" ? (
        <p className="rounded-xl border border-line bg-surf p-6 text-center text-mut shadow-sm">As inscrições desta prova estão encerradas.</p>
      ) : (
        <FormInscricaoPublica provaId={provaId} tipo={String(prova.tipo)} reprises={reprises.map((r) => ({ id: String(r._id), nome: String(r.nome) }))} />
      )}
    </main>
  );
}
