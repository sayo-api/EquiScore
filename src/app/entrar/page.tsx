import type { Metadata } from "next";
import Image from "next/image";
import { FormEntrar } from "./form";
export const metadata: Metadata = { title: "Entrar" };
export default function Entrar() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surf p-8 shadow-sm eqs-in">
        <div className="mb-7 flex flex-col items-center text-center">
          <Image src="/brand/escudo-512.png" alt="" width={64} height={64} priority />
          <h1 className="mt-3 text-2xl font-black">Equi<span className="text-red">Score</span></h1>
          <p className="mt-1 text-sm text-mut">Painel do organizador</p>
        </div>
        <FormEntrar />
      </div>
    </main>
  );
}
