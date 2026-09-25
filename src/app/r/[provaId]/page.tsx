import { notFound } from "next/navigation";
import Image from "next/image";
import { provaPublica } from "@/lib/server/consultas";
import { TelaoVivo } from "@/components/telao-vivo";

export const dynamic = "force-dynamic";
export default async function Acompanhar({ params }: PageProps<"/r/[provaId]">) {
  const { provaId } = await params;
  const prova = await provaPublica(provaId);
  if (!prova) notFound();
  return (
    <main className="mx-auto w-full max-w-md px-4 py-5">
      <header className="mb-4 flex items-center gap-2.5 border-b border-line pb-3">
        <Image src="/brand/escudo-512.png" alt="" width={30} height={30} priority />
        <div><h1 className="text-base font-black leading-tight">{String(prova.nome)}</h1>
          <p className="text-xs text-mut">Resultados ao vivo</p></div>
      </header>
      <TelaoVivo provaId={provaId} telao={false} />
    </main>
  );
}
