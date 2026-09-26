import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { COOKIE_COMP, lerSessaoComp } from "@/lib/server/sessao";
import { IconUsuarios } from "@/lib/icons";
import { FormEntrarComp } from "./form";

export const metadata: Metadata = { title: "Entrar — Competidor" };

export default async function EntrarComp() {
  if (await lerSessaoComp((await cookies()).get(COOKIE_COMP)?.value)) redirect("/competir");
  return (
    <div className="mx-auto w-full max-w-sm eqs-in">
      <div className="rounded-2xl border border-line bg-surf p-8 shadow-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-redwash text-red"><IconUsuarios width={28} height={28} /></span>
          <h1 className="mt-3 text-2xl font-black">Área do Competidor</h1>
          <p className="mt-1 text-sm text-mut">Entre para se inscrever nas provas.</p>
        </div>
        <FormEntrarComp />
        <p className="mt-5 text-center text-sm text-mut">Ainda não tem conta? <Link href="/competir/cadastro" className="font-semibold text-red hover:underline">Criar conta</Link></p>
      </div>
    </div>
  );
}
