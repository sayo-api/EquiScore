import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IconVoltar } from "@/lib/icons";
import { FormEntrar } from "./form";

export const metadata: Metadata = { title: "Entrar" };

export default function Entrar() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm eqs-in">
        <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-mut transition hover:text-red">
          <IconVoltar width={16} height={16} /> Início
        </Link>
        <div className="rounded-2xl border border-line bg-surf p-8 shadow-sm">
          <div className="mb-7 flex flex-col items-center text-center">
            <Image src="/brand/escudo-512.png" alt="" width={64} height={64} priority className="size-16 object-contain" />
            <h1 className="mt-3 text-2xl font-black">Equi<span className="text-red">Score</span></h1>
            <p className="mt-1 text-sm text-mut">Painel do organizador</p>
          </div>
          <FormEntrar />
        </div>
      </div>
    </main>
  );
}
