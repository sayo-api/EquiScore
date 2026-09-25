import Link from "next/link";
import { MarcaHorizontal } from "@/components/marca";

export default function Inicio() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surf">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <MarcaHorizontal />
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/resultados" className="rounded-lg px-3 py-2 font-semibold text-mut transition hover:text-ink">Resultados</Link>
            <Link href="/entrar" className="rounded-lg border border-line px-4 py-2 font-semibold transition hover:border-red hover:text-red">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-center">
        <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:py-24 eqs-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surf px-3 py-1 text-xs font-bold uppercase tracking-wider text-mut">
            Adestramento e Salto
          </span>
          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Apuração de provas,<br />do início ao <span className="text-red">resultado</span>.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-mut text-pretty">
            O EquiScore reúne inscrições, ordem de entrada, julgamento e classificação
            em um só lugar — com resultados publicados na hora e boletim em PDF no padrão.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/entrar" className="rounded-lg bg-red px-6 py-3 font-bold text-white shadow-sm transition hover:bg-red6">
              Entrar no painel
            </Link>
            <Link href="/resultados" className="rounded-lg border border-line bg-surf px-6 py-3 font-semibold shadow-sm transition hover:border-red hover:text-red">
              Ver resultados
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surf">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-mut sm:flex-row">
          <MarcaHorizontal />
          <p>© {new Date().getFullYear()} EquiScore · Apuração de adestramento e salto</p>
        </div>
      </footer>
    </div>
  );
}
