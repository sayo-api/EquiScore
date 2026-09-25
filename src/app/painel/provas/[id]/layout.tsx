import { notFound } from "next/navigation";
import Link from "next/link";
import { provaDoDono } from "@/lib/server/consultas";
import { exigirSessao } from "@/lib/server/sessao";
import { IconVoltar } from "@/lib/icons";
import { AbasProva } from "./abas";

export default async function ProvaLayout({ children, params }: LayoutProps<"/painel/provas/[id]">) {
  const { id } = await params;
  const { userId } = await exigirSessao();
  const prova = await provaDoDono(id, userId);
  if (!prova) notFound();
  const fmt = (d: unknown) => (d ? new Date(d as string).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "");
  return (
    <div className="eqs-in">
      <Link href="/painel" className="inline-flex items-center gap-1 text-sm text-mut hover:text-red">
        <IconVoltar width={16} height={16} /> Provas
      </Link>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{String(prova.nome)}</h1>
        <span className="rounded bg-redwash px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-red6">
          {prova.tipo === "SALTO" ? "Salto" : "Adestramento"}
        </span>
      </div>
      <p className="mt-1 text-sm text-mut">{[prova.local, fmt(prova.data)].filter(Boolean).join(" · ")}</p>
      <AbasProva id={id} tipo={String(prova.tipo)} />
      <div className="mt-6">{children}</div>
    </div>
  );
}
