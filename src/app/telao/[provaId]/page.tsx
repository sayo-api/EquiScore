import { notFound } from "next/navigation";
import Image from "next/image";
import { provaPublica } from "@/lib/server/consultas";
import { TelaoVivo } from "@/components/telao-vivo";

export const dynamic = "force-dynamic";
export default async function Telao({ params }: PageProps<"/telao/[provaId]">) {
  const { provaId } = await params;
  const prova = await provaPublica(provaId);
  if (!prova) notFound();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6">
      <header className="mb-5 flex items-center gap-3 border-b border-line pb-4">
        <Image src="/brand/escudo-512.png" alt="" width={40} height={40} priority />
        <div>
          <h1 className="text-2xl font-black leading-tight">{String(prova.nome)}</h1>
          <p className="text-sm text-mut">{[prova.local, prova.tipo === "SALTO" ? "Salto" : "Adestramento"].filter(Boolean).join(" · ")}</p>
        </div>
      </header>
      <TelaoVivo provaId={provaId} telao />
    </main>
  );
}
