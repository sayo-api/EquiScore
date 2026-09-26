import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Avaliacao, Cavaleiro, Juiz, Reprise } from "@/lib/server/models";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { ordenar } from "@/lib/domain/ordem";
import { IconTv, IconGavel, IconCheck, IconRelogio, IconVoltar } from "@/lib/icons";
import { BotaoPista, BotaoReset } from "./pista-cliente";

const BADGE: Record<string, { cls: string; txt: string }> = {
  FINALIZADO: { cls: "bg-okwash text-ok", txt: "Finalizado" },
  ELIMINADO: { cls: "bg-redwash text-red6", txt: "Eliminado" },
  EM_ANDAMENTO: { cls: "bg-warnwash text-warn", txt: "Julgando" },
  AGUARDANDO: { cls: "bg-surf2 text-dim", txt: "Aguardando" },
};

export default async function Pista({ params }: PageProps<"/painel/provas/[id]/julgar">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = (await provaDoDono(id, userId))!;
  await conectar();
  const tipo = String(prova.tipo);
  const comps = await Cavaleiro.find({ provaId: prova._id, status: { $ne: "PENDENTE" } }).sort({ ordemEntrada: 1 }).lean();
  const reprises = await Reprise.find({ _id: { $in: (prova.reprises as Types.ObjectId[]) || [] } }, { nome: 1 }).lean();
  const nomeRep = new Map(reprises.map((r) => [String(r._id), String(r.nome)]));
  const emPista = prova.cavaleiroEmPista ? String(prova.cavaleiroEmPista) : "";

  // Quantos juízes já lançaram nota por conjunto (só adestramento).
  const numJuizes = Math.max(1, Math.min(5, Number(prova.numJuizes || 1)));
  const progresso = new Map<string, number>();
  if (tipo === "ADESTRAMENTO") {
    const avals = await Avaliacao.find({ provaId: prova._id }, { cavaleiroId: 1 }).lean();
    for (const a of avals) progresso.set(String(a.cavaleiroId), (progresso.get(String(a.cavaleiroId)) || 0) + 1);
  }
  const totalJuizes = tipo === "ADESTRAMENTO"
    ? Math.max(numJuizes, await Juiz.countDocuments({ provaId: prova._id }))
    : 0;

  const chave = (c: (typeof comps)[number]) => (tipo === "ADESTRAMENTO" ? String(c.repriseId || "") : String(c.categoria || ""));
  const ordemChaves = tipo === "ADESTRAMENTO" ? ((prova.reprises as Types.ObjectId[]) || []).map(String) : [...new Set(comps.map(chave))];
  const itens = ordenar(comps.map((c) => ({ ...c, chaveReprise: chave(c), ordemEntrada: Number(c.ordemEntrada || 0) })), !!prova.mesclar, ordemChaves);

  if (!itens.length) return <p className="rounded-xl border border-dashed border-line p-10 text-center text-mut">Nenhum inscrito. Adicione na aba Inscrições.</p>;

  return (
    <div className="eqs-in">
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-line bg-surf2 p-4 text-sm">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-redwash text-red"><IconTv width={18} height={18} /></span>
        <div className="text-mut">
          <p className="font-semibold text-ink">Controle de pista</p>
          {tipo === "ADESTRAMENTO"
            ? <p className="mt-0.5">Marque quem está entrando na pista — aparece em destaque no telão e na tela dos juízes. As notas são lançadas pelos <Link href={`/painel/provas/${id}/juizes`} className="font-semibold text-red hover:underline">juízes</Link> nas próprias contas.</p>
            : <p className="mt-0.5">Marque quem está em pista e toque no conjunto para lançar o resultado.</p>}
        </div>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
        {itens.map((c) => {
          const cid = String(c._id);
          const atual = cid === emPista;
          const st = BADGE[String(c.status)] ?? BADGE.AGUARDANDO;
          const feitas = progresso.get(cid) || 0;
          const conteudo = (
            <>
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg font-mono text-sm font-bold ${atual ? "bg-red text-white" : "bg-surf2 text-mut"}`}>{c.ordemEntrada || "–"}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold">
                  <span className="truncate">{[c.postoGraduacao, c.nome].filter(Boolean).join(" ")}</span>
                  {atual && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red px-2 py-0.5 text-[10px] font-bold text-white"><IconTv width={11} height={11} /> EM PISTA</span>}
                </span>
                <span className="block truncate text-sm text-mut">{c.cavalo}{tipo === "ADESTRAMENTO" ? ` · ${nomeRep.get(String(c.repriseId)) ?? "—"}` : c.categoria ? ` · ${c.categoria}` : ""}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {tipo === "ADESTRAMENTO" && totalJuizes > 0 && (
                  <span className={`hidden items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold sm:inline-flex ${feitas >= totalJuizes ? "bg-okwash text-ok" : "bg-surf2 text-mut"}`}>
                    {feitas >= totalJuizes ? <IconCheck width={12} height={12} /> : <IconRelogio width={12} height={12} />} {feitas}/{totalJuizes} juízes
                  </span>
                )}
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.txt}</span>
              </span>
            </>
          );
          return (
            <li key={cid} className={`flex items-center gap-3 border-t border-line2 px-4 py-3 first:border-0 ${atual ? "bg-redwash/60" : ""}`}>
              {tipo === "SALTO" ? (
                <Link href={`/painel/provas/${id}/julgar/${cid}`} className="flex flex-1 items-center gap-3 transition hover:opacity-80">{conteudo}</Link>
              ) : (
                <div className="flex flex-1 items-center gap-3">{conteudo}</div>
              )}
              <BotaoPista provaId={id} cavId={cid} atual={atual} />
              <BotaoReset provaId={id} cavId={cid} nome={[c.postoGraduacao, c.nome].filter(Boolean).join(" ")} />
              {tipo === "SALTO" && (
                <Link href={`/painel/provas/${id}/julgar/${cid}`} aria-label="Lançar resultado" className="grid size-9 place-items-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red"><IconGavel width={16} height={16} /></Link>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-mut"><IconVoltar width={12} height={12} className="mr-1 inline rotate-90" /> A ordem segue a aba Ordem de entrada.</p>
    </div>
  );
}
