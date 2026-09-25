"use client";
import { useActionState, useEffect, useState, useTransition } from "react";
import { IconPlus, IconLapis, IconLixeira, IconX, IconEscudo, IconUsuarios } from "@/lib/icons";
import { somSucesso, somAviso } from "@/lib/som";
import { criarUsuario, editarUsuario, excluirUsuario, type EstadoUsuario } from "./actions";

export type UsuarioLinha = {
  id: string; usuario: string; nome: string; role: "ADMIN" | "SUPER";
  provas: number; competidores: number; criadoEm: string;
};

const campo = "w-full rounded-lg border border-line bg-surf px-3 py-2.5 text-base outline-none transition focus:border-red";

function Papel({ role }: { role: "ADMIN" | "SUPER" }) {
  return role === "SUPER" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-redwash px-2.5 py-0.5 text-xs font-bold text-red6"><IconEscudo width={13} height={13} /> Administrador</span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-surf2 px-2.5 py-0.5 text-xs font-semibold text-mut"><IconUsuarios width={13} height={13} /> Organizador</span>
  );
}

export function GerenciarUsuarios({ usuarios, meuId }: { usuarios: UsuarioLinha[]; meuId: string }) {
  const [editando, setEditando] = useState<UsuarioLinha | null>(null);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-mut">
              <th className="px-4 py-3 font-bold">Usuário</th>
              <th className="px-4 py-3 font-bold">Papel</th>
              <th className="hidden px-4 py-3 text-center font-bold sm:table-cell">Provas</th>
              <th className="hidden px-4 py-3 text-center font-bold sm:table-cell">Conjuntos</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t border-line2 transition hover:bg-surf2">
                <td className="px-4 py-3">
                  <div className="font-mono font-bold">{u.usuario}{u.id === meuId && <span className="ml-1 text-xs font-normal text-dim">(você)</span>}</div>
                  {u.nome && u.nome !== u.usuario && <div className="text-xs text-mut">{u.nome}</div>}
                </td>
                <td className="px-4 py-3"><Papel role={u.role} /></td>
                <td className="hidden px-4 py-3 text-center font-mono sm:table-cell">{u.provas}</td>
                <td className="hidden px-4 py-3 text-center font-mono sm:table-cell">{u.competidores}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditando(u)} aria-label={`Editar ${u.usuario}`}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-line text-mut transition hover:border-red hover:text-red active:scale-95">
                    <IconLapis width={15} height={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <FormNovo />
      {editando && <ModalEditar usuario={editando} meuId={meuId} onFechar={() => setEditando(null)} />}
    </div>
  );
}

function FormNovo() {
  const [estado, acao, enviando] = useActionState<EstadoUsuario, FormData>(criarUsuario, undefined);
  useEffect(() => { if (estado?.ok) somSucesso(); else if (estado?.erro) somAviso(); }, [estado]);
  return (
    <section className="h-fit rounded-2xl border border-line bg-surf p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-bold"><IconPlus width={18} height={18} className="text-red" /> Novo acesso</h2>
      <form action={acao} className="flex flex-col gap-3">
        <input name="usuario" placeholder="Login (ex.: joao.silva)" required className={campo} autoComplete="off" />
        <input name="nome" placeholder="Nome (opcional)" className={campo} autoComplete="off" />
        <input name="senha" type="password" placeholder="Senha" required className={campo} autoComplete="new-password" />
        <select name="role" defaultValue="ADMIN" className={campo}>
          <option value="ADMIN">Organizador (só as próprias provas)</option>
          <option value="SUPER">Administrador (gerencia acessos)</option>
        </select>
        {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
        {estado?.ok && <p className="rounded-lg bg-okwash px-3 py-2 text-sm font-semibold text-ok">{estado.ok}</p>}
        <button data-som="off" disabled={enviando} className="rounded-lg bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
          {enviando ? "Criando…" : "Criar usuário"}
        </button>
      </form>
    </section>
  );
}

function ModalEditar({ usuario, meuId, onFechar }: { usuario: UsuarioLinha; meuId: string; onFechar: () => void }) {
  const [estado, acao, enviando] = useActionState<EstadoUsuario, FormData>(editarUsuario, undefined);
  const [pend, start] = useTransition();
  const [confirmar, setConfirmar] = useState(false);
  const [erroDel, setErroDel] = useState<string>();
  const ehEu = usuario.id === meuId;

  useEffect(() => { if (estado?.ok) { somSucesso(); onFechar(); } else if (estado?.erro) somAviso(); }, [estado, onFechar]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onFechar(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onFechar]);

  const remover = () => start(async () => {
    const r = await excluirUsuario(usuario.id);
    if (r.erro) { setErroDel(r.erro); somAviso(); } else { onFechar(); }
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 eqs-fade" onClick={onFechar}>
      <div className="w-full max-w-md rounded-2xl border border-line bg-surf p-6 shadow-lg eqs-pop" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black">Editar <span className="font-mono">{usuario.usuario}</span></h2>
          <button onClick={onFechar} aria-label="Fechar" className="grid size-8 place-items-center rounded-lg text-mut transition hover:bg-surf2 hover:text-ink active:scale-95"><IconX width={18} height={18} /></button>
        </div>
        <form action={acao} className="flex flex-col gap-3">
          <input type="hidden" name="id" value={usuario.id} />
          <label className="text-sm font-semibold text-mut">Nome
            <input name="nome" defaultValue={usuario.nome} className={campo + " mt-1"} />
          </label>
          <label className="text-sm font-semibold text-mut">Nova senha <span className="font-normal text-dim">(deixe em branco para manter)</span>
            <input name="senha" type="password" placeholder="••••••" className={campo + " mt-1"} autoComplete="new-password" />
          </label>
          <label className="text-sm font-semibold text-mut">Papel
            <select name="role" defaultValue={usuario.role} disabled={ehEu} className={campo + " mt-1 disabled:opacity-60"}>
              <option value="ADMIN">Organizador</option>
              <option value="SUPER">Administrador</option>
            </select>
            {ehEu && <span className="mt-1 block text-xs font-normal text-dim">Você não pode alterar o próprio papel.</span>}
          </label>
          {estado?.erro && <p role="alert" className="rounded-lg bg-redwash px-3 py-2 text-sm text-red6 eqs-shake">{estado.erro}</p>}
          <button data-som="off" disabled={enviando} className="rounded-lg bg-red py-2.5 font-bold text-white shadow-sm transition hover:bg-red6 active:scale-[.98] disabled:opacity-60">
            {enviando ? "Salvando…" : "Salvar alterações"}
          </button>
        </form>

        {!ehEu && (
          <div className="mt-5 border-t border-line pt-4">
            {!confirmar ? (
              <button onClick={() => setConfirmar(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-red transition hover:text-red6">
                <IconLixeira width={16} height={16} /> Excluir usuário
              </button>
            ) : (
              <div className="rounded-lg bg-redwash p-3 eqs-fade">
                <p className="text-sm font-semibold text-red6">Excluir <span className="font-mono">{usuario.usuario}</span> e todas as provas, inscrições e resultados dele? Não há como desfazer.</p>
                {erroDel && <p className="mt-1 text-sm text-red6">{erroDel}</p>}
                <div className="mt-3 flex gap-2">
                  <button disabled={pend} onClick={remover} className="rounded-lg bg-red px-3 py-2 text-sm font-bold text-white transition hover:bg-red6 active:scale-95 disabled:opacity-60">{pend ? "Excluindo…" : "Sim, excluir"}</button>
                  <button disabled={pend} onClick={() => setConfirmar(false)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold transition hover:border-dim active:scale-95">Cancelar</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
