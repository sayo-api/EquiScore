import { cookies } from "next/headers";
import { COOKIE_COMP, lerSessaoComp } from "@/lib/server/sessao";
import { MarcaHorizontal } from "@/components/marca";
import { BotaoSom } from "@/components/botao-som";
import { IconSair } from "@/lib/icons";
import { sairComp } from "./actions";

export default async function CompLayout({ children }: LayoutProps<"/competir">) {
  const s = await lerSessaoComp((await cookies()).get(COOKIE_COMP)?.value);
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-surf/85 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <MarcaHorizontal href={s ? "/competir" : "/"} />
          <div className="flex items-center gap-2 text-sm">
            {s && <span className="hidden text-mut sm:inline">{s.nome}</span>}
            <BotaoSom />
            {s && (
              <form action={sairComp}>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 font-semibold text-mut transition hover:border-red hover:text-red"><IconSair width={16} height={16} /> Sair</button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
