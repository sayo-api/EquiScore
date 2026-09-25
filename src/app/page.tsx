import Image from "next/image";
import Link from "next/link";

export default function Inicio() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(193_18_31/0.28),transparent_60%)]"
      />
      <Image
        src="/brand/escudo-512.png"
        alt="Escudo EquiScore"
        width={220}
        height={220}
        priority
        className="eqs-glow relative"
      />
      <h1 className="relative mt-8 text-5xl font-black tracking-tight sm:text-6xl">
        Equi<span className="text-eqs-red">Score</span>
      </h1>
      <p className="relative mt-3 text-sm font-semibold uppercase tracking-[0.35em] text-neutral-400">EQS</p>
      <p className="relative mt-6 max-w-xl text-neutral-300">
        Apuração de provas de <strong className="text-white">adestramento</strong> e{" "}
        <strong className="text-white">salto</strong>: inscrições, ordem de entrada, julgamento e resultados em tempo
        real.
      </p>
      <div className="relative mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/entrar"
          className="rounded-lg bg-eqs-red px-6 py-3 font-bold text-white shadow-lg shadow-eqs-red/30 transition hover:bg-eqs-red-600"
        >
          Entrar no painel
        </Link>
        <Link
          href="/resultados"
          className="rounded-lg border border-white/20 px-6 py-3 font-bold text-white transition hover:border-white/50"
        >
          Resultados
        </Link>
      </div>
    </main>
  );
}
