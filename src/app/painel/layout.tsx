import { MarcaHorizontal } from "@/components/marca";
import { BotaoSom } from "@/components/botao-som";
import Link from "next/link";
import { exigirSessao } from "@/lib/server/sessao";
import { IconSair, IconEscudo } from "@/lib/icons";
import { sair } from "../entrar/actions";

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const sessao = await exigirSessao();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surf/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <MarcaHorizontal href="/painel" />
          <div className="flex items-center gap-3 text-sm">
            {sessao.role === "SUPER" && (
              <Link href="/painel/admin" className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-semibold text-mut transition hover:border-red hover:text-red">
                <IconEscudo width={16} height={16} /> Admin
              </Link>
            )}
            <span className="hidden text-mut sm:inline">{sessao.nome}</span>
            <BotaoSom />
            <form action={sair}>
              <button className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-semibold text-mut transition hover:border-red hover:text-red">
                <IconSair width={16} height={16} /> Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
