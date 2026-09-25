import { MarcaHorizontal } from "@/components/marca";
import { exigirSessao } from "@/lib/server/sessao";
import { sair } from "../entrar/actions";

export default async function PainelLayout({ children }: LayoutProps<"/painel">) {
  const sessao = await exigirSessao();
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-eqs-line bg-eqs-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <MarcaHorizontal href="/painel" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-neutral-400 sm:inline">{sessao.nome}</span>
            <form action={sair}>
              <button className="rounded-md border border-eqs-line px-3 py-1.5 font-semibold hover:border-eqs-red">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
