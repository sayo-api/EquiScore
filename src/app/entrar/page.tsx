import type { Metadata } from "next";
import Image from "next/image";
import { FormEntrar } from "./form";

export const metadata: Metadata = { title: "Entrar" };

export default function Entrar() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-eqs-line bg-eqs-ink-2 p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/brand/escudo-512.png" alt="" width={72} height={72} className="eqs-glow" priority />
          <h1 className="mt-4 text-2xl font-black">
            Equi<span className="text-eqs-red">Score</span>
          </h1>
          <p className="mt-1 text-sm text-neutral-400">Painel do organizador</p>
        </div>
        <FormEntrar />
      </div>
    </main>
  );
}
