import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Prova, Reprise } from "@/lib/server/models";
import { exigirComp } from "@/lib/server/sessao";
import { IconTrofeu, IconPlus, IconCheck, IconRelogio } from "@/lib/icons";
import { CancelarInscricao } from "./cliente";

const fmtData = (d: unknown) => (d ? new Date(d as string).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Sem data");
const ST: Record<string, { cls: string; txt: string }> = {
  PENDENTE: { cls: "bg-warnwash text-warn", txt: "Aguardando aprovação" },
  AGUARDANDO: { cls: "bg-okwash text-ok", txt: "Inscrição aprovada" },
  EM_ANDAMENTO: { cls: "bg-okwash text-ok", txt: "Aprovada" },
  FINALIZADO: { cls: "bg-surf2 text-mut", txt: "Concluído" },
  ELIMINADO: { cls: "bg-redwash text-red6", txt: "Eliminado" },
};

export default async function CompDashboard() {
  const s = await exigirComp();
  await conectar();
  const provas = await Prova.find({ status: "ATIVA" }).sort({ data: 1, _id: -1 }).limit(50).lean();
  const minhas = await Cavaleiro.find({ competidorId: new Types.ObjectId(s.compId) }).sort({ _id: -1 }).lean();
  const provaIds = [...new Set(minhas.map((m) => String(m.provaId)))];
  const provasDelas = await Prova.find({ _id: { $in: provaIds } }, { nome: 1 }).lean();
  const nomeProva = new Map(provasDelas.map((p) => [String(p._id), String(p.nome)]));
  const repriseIds = minhas.map((m) => m.repriseId).filter(Boolean);
  const reprises = await Reprise.find({ _id: { $in: repriseIds } }, { nome: 1 }).lean();
  const nomeRep = new Map(reprises.map((r) => [String(r._id), String(r.nome)]));

  return (
    <div className="eqs-in">
      <h1 className="text-2xl font-black tracking-tight">Olá, {s.nome.split(" ")[0] || "competidor"}!</h1>
      <p className="mt-1 text-sm text-mut">Inscreva-se nas provas abertas e acompanhe suas inscrições.</p>

      <section className="mt-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-mut"><IconTrofeu width={16} height={16} className="text-red" /> Provas abertas</h2>
        {provas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Nenhuma prova aberta no momento.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {provas.map((p) => (
              <li key={String(p._id)} className="flex flex-col rounded-2xl border border-line bg-surf p-5 shadow-sm transition hover:border-redln hover:shadow-md">
                <span className="inline-flex w-fit rounded-full bg-redwash px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red6">{p.tipo === "SALTO" ? "Salto" : "Adestramento"}</span>
                <h3 className="mt-2 text-lg font-black leading-tight">{String(p.nome)}</h3>
                <p className="mt-0.5 text-sm text-mut">{[String(p.local || ""), fmtData(p.data)].filter(Boolean).join(" · ")}</p>
                <Link href={`/competir/prova/${p._id}`} className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.99]">
                  <IconPlus width={17} height={17} /> Inscrever-se
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-mut"><IconCheck width={16} height={16} className="text-red" /> Minhas inscrições</h2>
        {minhas.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-mut">Você ainda não se inscreveu em nenhuma prova.</p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
            {minhas.map((m) => {
              const st = ST[String(m.status)] ?? ST.PENDENTE;
              return (
                <li key={String(m._id)} className="flex items-center gap-3 border-t border-line2 px-4 py-3 first:border-0">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{nomeProva.get(String(m.provaId)) || "Prova"}</span>
                    <span className="block truncate text-sm text-mut">{String(m.cavalo)}{m.repriseId ? ` · ${nomeRep.get(String(m.repriseId)) ?? ""}` : m.categoria ? ` · ${m.categoria}` : ""}</span>
                  </span>
                  <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>
                    {String(m.status) === "PENDENTE" ? <IconRelogio width={12} height={12} /> : <IconCheck width={12} height={12} />} {st.txt}
                  </span>
                  {String(m.status) === "PENDENTE" && <CancelarInscricao cavId={String(m._id)} />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
