import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { COOKIE_COMP, lerSessaoComp } from "@/lib/server/sessao";
import { FormCadastroComp } from "./form";

export const metadata: Metadata = { title: "Criar conta — Competidor" };

export default async function CadastroComp() {
  if (await lerSessaoComp((await cookies()).get(COOKIE_COMP)?.value)) redirect("/competir");
  return (
    <div className="mx-auto w-full max-w-sm eqs-in">
      <div className="rounded-2xl border border-line bg-surf p-8 shadow-sm">
        <h1 className="text-2xl font-black">Criar conta</h1>
        <p className="mt-1 mb-6 text-sm text-mut">Crie sua conta de competidor para se inscrever nas provas.</p>
        <FormCadastroComp />
        <p className="mt-5 text-center text-sm text-mut">Já tem conta? <Link href="/competir/entrar" className="font-semibold text-red hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}
