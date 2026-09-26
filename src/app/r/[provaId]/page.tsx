import { notFound } from "next/navigation";
import Image from "next/image";
import { provaPublica } from "@/lib/server/consultas";
import { AcompanharVivo } from "@/components/acompanhar-vivo";

export const dynamic = "force-dynamic";
export default async function Acompanhar({ params }: PageProps<"/r/[provaId]">) {
  const { provaId } = await params;
  const prova = await provaPublica(provaId);
  if (!prova) notFound();
  return (
    <main className="mx-auto w-full max-w-md px-4 pb-10 pt-4">
      <header className="mb-4 flex items-center gap-2.5 border-b border-line pb-3">
        <Image src="/brand/escudo-512.png" alt="" width={30} height={30} priority className="size-8 object-contain" />
        <div className="min-w-0">
          <h1 className="truncate text-base font-black leading-tight">{String(prova.nome)}</h1>
          <p className="text-xs text-mut">{[String(prova.local || ""), "Resultados ao vivo"].filter(Boolean).join(" · ")}</p>
        </div>
      </header>
      <AcompanharVivo provaId={provaId} />
      <p className="mt-6 text-center text-xs text-dim">Toque num conjunto para ver as notas de cada juiz.</p>
    </main>
  );
}
