import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_JUIZ, lerSessaoJuiz } from "@/lib/server/sessao";
import { IconGavel } from "@/lib/icons";
import { FormEntrarJuiz } from "./form";

export const metadata: Metadata = { title: "Entrar — Juiz" };

export default async function EntrarJuiz() {
  const s = await lerSessaoJuiz((await cookies()).get(COOKIE_JUIZ)?.value);
  if (s) redirect("/juiz");
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm eqs-in">
        <div className="rounded-2xl border border-line bg-surf p-8 shadow-sm">
          <div className="mb-7 flex flex-col items-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-redwash text-red"><IconGavel width={28} height={28} /></span>
            <h1 className="mt-3 text-2xl font-black">Área do Juiz</h1>
            <p className="mt-1 text-sm text-mut">Entre para lançar as notas da sua letra.</p>
          </div>
          <FormEntrarJuiz />
        </div>
      </div>
    </main>
  );
}
