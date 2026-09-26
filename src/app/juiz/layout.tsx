import { cookies } from "next/headers";
import { COOKIE_JUIZ, lerSessaoJuiz } from "@/lib/server/sessao";
import { conectar } from "@/lib/server/db";
import { Prova } from "@/lib/server/models";
import { IconGavel, IconSair } from "@/lib/icons";
import { BotaoSom } from "@/components/botao-som";
import { sairJuiz } from "./actions";

export default async function JuizLayout({ children }: LayoutProps<"/juiz">) {
  const s = await lerSessaoJuiz((await cookies()).get(COOKIE_JUIZ)?.value);
  let provaNome = "";
  if (s) {
    await conectar();
    const p = await Prova.findById(s.provaId).lean<Record<string, unknown>>();
    provaNome = String(p?.nome || "");
  }
  return (
    <div className="flex flex-1 flex-col">
      {s && (
        <header className="sticky top-0 z-10 border-b border-line bg-surf/85 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-redwash text-red"><IconGavel width={18} height={18} /></span>
              <div className="leading-tight">
                <div className="text-sm font-black">Juiz {s.letra} · {s.nome}</div>
                <div className="text-xs text-mut">{provaNome}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BotaoSom />
              <form action={sairJuiz}>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-sm font-semibold text-mut transition hover:border-red hover:text-red"><IconSair width={16} height={16} /> Sair</button>
              </form>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
