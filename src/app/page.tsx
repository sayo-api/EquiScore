import Image from "next/image";
import Link from "next/link";
import { MarcaHorizontal } from "@/components/marca";
import { IconGavel, IconTrofeu, IconCelular, IconLista, IconUsuarios, IconPdf } from "@/lib/icons";

const recursos = [
  { icon: IconUsuarios, titulo: "Inscrições", desc: "Receba inscrições pelo celular e aprove os conjuntos com um clique." },
  { icon: IconLista, titulo: "Ordem de entrada", desc: "Sorteio automático com espaçamento entre cavalos do mesmo cavaleiro." },
  { icon: IconGavel, titulo: "Julgamento", desc: "Folhas de adestramento por juiz e apuração de salto por baremo, em tempo real." },
  { icon: IconTrofeu, titulo: "Resultados", desc: "Classificação consolidada e publicação imediata para o público." },
  { icon: IconPdf, titulo: "PDF oficial", desc: "Boletim de resultados no padrão, gerado e arquivado automaticamente." },
  { icon: IconCelular, titulo: "Acompanhamento", desc: "Telão de resultados e link para o público acompanhar pelo celular." },
];

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

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 md:grid-cols-[1.1fr_1fr] eqs-in">
          <div>
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
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="grid size-56 place-items-center rounded-3xl border border-line bg-surf shadow-sm sm:size-72">
              <Image src="/brand/escudo-512.png" alt="Escudo EquiScore" width={200} height={200} priority className="size-40 object-contain sm:size-52" />
            </div>
          </div>
        </section>

        {/* Recursos */}
        <section className="border-t border-line bg-surf2">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-black tracking-tight sm:text-3xl">Tudo o que a prova precisa</h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-mut">
              Fluxo completo para organizadores e juízes, e acompanhamento simples para o público.
            </p>
            <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recursos.map(({ icon: Icon, titulo, desc }) => (
                <li key={titulo} className="rounded-2xl border border-line bg-surf p-6 shadow-sm transition hover:border-redln hover:shadow-md">
                  <span className="grid size-11 place-items-center rounded-xl bg-redwash text-red">
                    <Icon width={22} height={22} />
                  </span>
                  <h3 className="mt-4 text-lg font-bold">{titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-mut">{desc}</p>
                </li>
              ))}
            </ul>
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
