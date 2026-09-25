import Image from "next/image";
import Link from "next/link";

export default function Inicio() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 text-center eqs-in">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_38%,rgba(193,18,31,.07),transparent_70%)]" />
      <Image src="/brand/escudo-512.png" alt="Escudo EquiScore" width={190} height={190} priority className="relative" />
      <h1 className="relative mt-6 text-5xl font-black tracking-tight sm:text-6xl">Equi<span className="text-red">Score</span></h1>
      <p className="relative mt-3 text-xs font-bold uppercase tracking-[0.5em] text-dim">EQS</p>
      <p className="relative mt-6 max-w-xl text-mut text-pretty">
        Apuração de provas de <strong className="text-ink">adestramento</strong> e <strong className="text-ink">salto</strong>:
        inscrições, ordem de entrada, julgamento e resultados.
      </p>
      <div className="relative mt-9 flex flex-wrap justify-center gap-3">
        <Link href="/entrar" className="rounded-lg bg-red px-6 py-3 font-bold text-white shadow-sm transition hover:bg-red6">Entrar no painel</Link>
      </div>
    </main>
  );
}
