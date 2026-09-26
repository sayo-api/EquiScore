import Link from "next/link";
import Image from "next/image";
import { MarcaHorizontal } from "@/components/marca";
import { IconWhats } from "@/lib/icons";

export default function Inicio() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-surf">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <MarcaHorizontal />
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/resultados" className="rounded-lg px-3 py-2 font-semibold text-mut transition hover:text-ink">Resultados</Link>
            <Link href="/competir" className="rounded-lg px-3 py-2 font-semibold text-mut transition hover:text-ink">Competir</Link>
            <Link href="/entrar" className="rounded-lg border border-line px-4 py-2 font-semibold transition hover:border-red hover:text-red">Entrar</Link>
          </nav>
        </div>
      </header>

      <main className="flex flex-1 items-end">
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
            <Link href="/competir" className="rounded-lg border border-line bg-surf px-6 py-3 font-semibold shadow-sm transition hover:border-red hover:text-red">
              Sou competidor
            </Link>
          </div>
        </section>
      </main>

      <section className="mx-auto -mt-6 w-full max-w-2xl px-4 pb-16 eqs-in">
        <div className="overflow-hidden rounded-2xl border border-redln bg-gradient-to-r from-red6 to-red text-white shadow-sm">
          <div className="flex flex-col items-center gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6">
            <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/95 shadow-inner">
              <Image src="/brand/escudo-512.png" alt="EquiScore" width={52} height={52} className="size-13 object-contain" />
            </span>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Organizadores</p>
              <h2 className="text-lg font-black leading-tight">Quer criar seus eventos e provas?</h2>
              <p className="mt-0.5 text-sm text-white/85">Peça seu login de organizador com <b>sayoz</b> e comece a apurar no EquiScore.</p>
            </div>
            <a href="https://wa.me/5561935053288?text=Ol%C3%A1%20sayoz!%20Quero%20um%20login%20de%20organizador%20no%20EquiScore."
              target="_blank" rel="noopener"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 font-bold text-red6 shadow-sm transition hover:bg-white/90 active:scale-[.98]">
              <IconWhats width={20} height={20} /> (61) 93505-3288
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-surf">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-mut sm:flex-row">
          <MarcaHorizontal />
          <p>© {new Date().getFullYear()} EquiScore · Apuração de adestramento e salto</p>
        </div>
      </footer>
    </div>
  );
}
