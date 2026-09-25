import type { Metadata } from "next";
import { Types } from "mongoose";
import { conectar } from "@/lib/server/db";
import { Admin, Cavaleiro, Prova } from "@/lib/server/models";
import { exigirSuper } from "@/lib/server/sessao";
import { IconEscudo } from "@/lib/icons";
import { GerenciarUsuarios, type UsuarioLinha } from "./cliente";

export const metadata: Metadata = { title: "Administração" };

export default async function PainelAdmin() {
  const eu = await exigirSuper();
  await conectar();
  const admins = await Admin.find({}, { username: 1, nome: 1, role: 1, createdAt: 1 }).sort({ role: 1, nome: 1 }).lean();

  const linhas: UsuarioLinha[] = await Promise.all(
    admins.map(async (u) => {
      const dono = new Types.ObjectId(String(u._id));
      const [provas, competidores] = await Promise.all([
        Prova.countDocuments({ ownerId: dono }),
        Cavaleiro.countDocuments({ ownerId: dono, status: { $ne: "PENDENTE" } }),
      ]);
      return {
        id: String(u._id),
        usuario: String(u.username || ""),
        nome: String(u.nome || ""),
        role: u.role === "SUPER" ? "SUPER" : "ADMIN",
        provas,
        competidores,
        criadoEm: u.createdAt ? new Date(u.createdAt as Date).toLocaleDateString("pt-BR") : "",
      };
    }),
  );

  return (
    <div className="eqs-in">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-redwash text-red"><IconEscudo width={22} height={22} /></span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Administração</h1>
          <p className="text-sm text-mut">Gerencie os acessos e as permissões do sistema.</p>
        </div>
      </div>
      <GerenciarUsuarios usuarios={linhas} meuId={eu.userId} />
    </div>
  );
}
