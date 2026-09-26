import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { IconCheck, IconX } from "@/lib/icons";
import { FormInscricao } from "./form";
import { EditarInscricao } from "./editar";
import { aprovar, remover } from "./actions";

export default async function Inscricoes({ params }: PageProps<"/painel/provas/[id]/inscricoes"> ) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const comps = await Cavaleiro.find({ provaId: prova._id }).sort({ ordemEntrada: 1 }).lean();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  const nomeRep = new Map(reprises.map((r) => [String(r._id), String(r.nome)]));
  const listaReprises = reprises.map((r) => ({ id: String(r._id), nome: String(r.nome) }));
  const pendentes = comps.filter((c) => c.status === "PENDENTE");
  const aprovados = comps.filter((c) => c.status !== "PENDENTE");
  const linha = (c: (typeof comps)[number]) => (
    <li key={String(c._id)} className="flex items-center gap-3 border-t border-line2 px-4 py-3 first:border-0">
      <span className="flex-1">
        <span className="block font-semibold">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}</span>
        <span className="block text-sm text-mut">
          {c.cavalo}
          {prova.tipo === "ADESTRAMENTO" ? ` · ${nomeRep.get(String(c.repriseId)) ?? "—"}` : c.categoria ? ` · ${c.categoria}` : ""}
        </span>
      </span>
      {c.status === "PENDENTE" && (
        <form action={async () => { "use server"; await aprovar(id, String(c._id)); }}>
          <button className="inline-flex items-center gap-1 rounded-md border border-line px-2.5 py-1.5 text-sm font-semibold text-ok hover:border-ok"><IconCheck width={16} height={16} /> Aprovar</button>
        </form>
      )}
      <EditarInscricao provaId={id} tipo={String(prova.tipo)}
        inscrito={{ id: String(c._id), nome: String(c.nome || ""), posto: String(c.postoGraduacao || ""), cavalo: String(c.cavalo || ""), repriseId: String(c.repriseId || ""), categoria: String(c.categoria || "") }}
        reprises={listaReprises} />
      <form action={async () => { "use server"; await remover(id, String(c._id)); }}>
        <button aria-label="Remover" className="inline-flex items-center rounded-md border border-line p-1.5 text-mut hover:border-red hover:text-red"><IconX width={16} height={16} /></button>
      </form>
    </li>
  );
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col gap-6">
        {pendentes.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-warn">Aguardando aprovação ({pendentes.length})</h2>
            <ul className="rounded-xl border border-line bg-surf shadow-sm">{pendentes.map(linha)}</ul>
          </section>
        )}
        <section>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-mut">Inscritos ({aprovados.length})</h2>
          {aprovados.length === 0 ? <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Nenhum inscrito ainda.</p>
            : <ul className="rounded-xl border border-line bg-surf shadow-sm">{aprovados.map(linha)}</ul>}
        </section>
      </div>
      <FormInscricao provaId={id} tipo={String(prova.tipo)}
        reprises={reprises.map((r) => ({ id: String(r._id), nome: String(r.nome) }))} />
    </div>
  );
}
