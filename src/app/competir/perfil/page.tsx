import Link from "next/link";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Cavaleiro, Competidor } from "@/lib/server/models";
import { exigirComp } from "@/lib/server/sessao";
import { IconVoltar, IconCelular } from "@/lib/icons";
import { FormPerfil } from "./form";

export default async function Perfil() {
  const s = await exigirComp();
  await conectar();
  const perfil = await Competidor.findById(s.compId).lean<Record<string, unknown>>();
  const passados = await Cavaleiro.find({ competidorId: new Types.ObjectId(s.compId) }, { cavalo: 1 }).lean();
  const cavalos = [...new Set(passados.map((c) => String(c.cavalo || "").trim()).filter(Boolean))];

  return (
    <div className="mx-auto w-full max-w-md eqs-in">
      <Link href="/competir" className="inline-flex items-center gap-1 text-sm text-mut transition hover:text-red"><IconVoltar width={16} height={16} /> Voltar</Link>
      <h1 className="mt-2 mb-1 text-2xl font-black">Meu perfil</h1>
      <p className="mb-5 text-sm text-mut">{String(perfil?.email || s.email)}</p>
      <FormPerfil valores={{ nome: String(perfil?.nome || ""), postoGraduacao: String(perfil?.postoGraduacao || ""), telefone: String(perfil?.telefone || "") }} />

      <div className="mt-6 rounded-2xl border border-line bg-surf p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-mut"><IconCelular width={16} height={16} className="text-red" /> Meus cavalos</h2>
        {cavalos.length === 0 ? (
          <p className="mt-2 text-sm text-mut">Nenhum cavalo ainda. Ao se inscrever, seus cavalos ficam salvos aqui para reusar.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {cavalos.map((c) => <li key={c} className="rounded-full bg-surf2 px-3 py-1 text-sm font-semibold">{c}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
