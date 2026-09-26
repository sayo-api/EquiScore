"use client";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { IconUsuarios, IconLista, IconGavel, IconTrofeu, IconLink, IconTv, IconSpinner, IconRelogio, IconSalvar } from "@/lib/icons";

const abas = [
  { slug: "inscricoes", nome: "Inscrições", Icon: IconUsuarios },
  { slug: "ordem", nome: "Ordem de entrada", Icon: IconLista },
  { slug: "juizes", nome: "Juízes", Icon: IconGavel },
  { slug: "julgar", nome: "Pista", Icon: IconTv },
  { slug: "resultados", nome: "Resultados", Icon: IconTrofeu },
  { slug: "links", nome: "Links", Icon: IconLink },
  { slug: "historico", nome: "Histórico", Icon: IconRelogio },
  { slug: "config", nome: "Config", Icon: IconSalvar },
];

function Indicador({ Icon }: { Icon: (p: { width?: number; height?: number }) => React.ReactElement }) {
  const { pending } = useLinkStatus();
  return pending ? <IconSpinner width={16} height={16} /> : <Icon width={16} height={16} />;
}

export function AbasProva({ id }: { id: string; tipo: string }) {
  const path = usePathname();
  return (
    <nav className="mt-5 flex gap-1 overflow-x-auto border-b border-line" role="tablist">
      {abas.map(({ slug, nome, Icon }) => {
        const href = `/painel/provas/${id}/${slug}`;
        const ativo = path === href || (slug === "inscricoes" && path === `/painel/provas/${id}`);
        return (
          <Link key={slug} href={href} role="tab" aria-selected={ativo}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${ativo ? "border-red text-red" : "border-transparent text-mut hover:text-ink"}`}>
            <Indicador Icon={Icon} /> {nome}
          </Link>
        );
      })}
    </nav>
  );
}
