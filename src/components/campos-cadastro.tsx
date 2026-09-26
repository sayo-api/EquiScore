"use client";
import { useId } from "react";
import { POSTOS_MILITARES, POSTOS_CIVIS, CATEGORIAS } from "@/lib/postos";

export const campoCad = "w-full rounded-xl border border-line bg-surf px-3.5 py-2.5 text-base outline-none transition focus:border-red focus:ring-2 focus:ring-red/15";
export const rotulo = "mb-1 block text-xs font-bold uppercase tracking-wide text-mut";

export type CavaloSalvo = { nome: string; cavaloFiliacao?: string; cavaloPai?: string; cavaloMae?: string; tratador?: string };
export type ValoresCadastro = {
  postoGraduacao?: string; categoria?: string; nome?: string; cavalo?: string;
  cavaloFiliacao?: string; cavaloPai?: string; cavaloMae?: string; tratador?: string; equipe?: string;
  email?: string; telefone?: string;
};

export function PostoSelect({ valor }: { valor?: string }) {
  return (
    <select name="postoGraduacao" defaultValue={valor ?? ""} className={campoCad}>
      <option value="">—</option>
      <optgroup label="Militares">{POSTOS_MILITARES.map((p) => <option key={p} value={p}>{p}</option>)}</optgroup>
      <optgroup label="Civis">{POSTOS_CIVIS.map((p) => <option key={p} value={p}>{p}</option>)}</optgroup>
    </select>
  );
}

export function CategoriaSelect({ valor }: { valor?: string }) {
  return (
    <select name="categoria" defaultValue={valor ?? "Geral"} className={campoCad}>
      {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

/** Bloco comum do cadastro do conjunto (mesmos campos do sistema antigo). */
export function CamposConjunto({ v, categoria = true, cavalos, modo = "completo" }: { v?: ValoresCadastro; categoria?: boolean; cavalos?: CavaloSalvo[]; modo?: "completo" | "cavalo" }) {
  const listId = useId();
  const preencher = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!cavalos?.length) return;
    const achado = cavalos.find((c) => c.nome.toLowerCase() === e.target.value.trim().toLowerCase());
    if (!achado) return;
    const form = e.target.form;
    if (!form) return;
    const set = (name: string, val?: string) => {
      const el = form.elements.namedItem(name) as HTMLInputElement | null;
      if (el && !el.value && val) el.value = val;
    };
    set("cavaloFiliacao", achado.cavaloFiliacao);
    set("cavaloPai", achado.cavaloPai);
    set("cavaloMae", achado.cavaloMae);
    set("tratador", achado.tratador);
  };
  return (
    <>
      {modo === "completo" && (
        <>
          <div className="grid grid-cols-[110px_1fr] gap-3">
            <div><label className={rotulo}>Posto/Grad.</label><PostoSelect valor={v?.postoGraduacao} /></div>
            <div><label className={rotulo}>Nome do cavaleiro <span className="text-red">*</span></label>
              <input name="nome" defaultValue={v?.nome} placeholder="Nome completo" required className={campoCad} autoComplete="off" /></div>
          </div>
          {categoria && <div><label className={rotulo}>Categoria</label><CategoriaSelect valor={v?.categoria} /></div>}
        </>
      )}
      <div><label className={rotulo}>Nome do cavalo <span className="text-red">*</span></label>
        <input name="cavalo" defaultValue={v?.cavalo} placeholder="Nome da montada" required className={campoCad} autoComplete="off"
          list={cavalos?.length ? listId : undefined} onChange={cavalos?.length ? preencher : undefined} />
        {cavalos?.length ? <datalist id={listId}>{cavalos.map((c) => <option key={c.nome} value={c.nome} />)}</datalist> : null}
        {cavalos?.length ? <small className="mt-1 block text-xs text-dim">Escolha um cavalo já usado para preencher os dados automaticamente.</small> : null}
      </div>
      <details className="rounded-xl border border-line2 bg-surf2/60 px-3.5 py-2.5">
        <summary className="cursor-pointer select-none text-sm font-semibold text-mut">Dados do cavalo e contato (opcional)</summary>
        <div className="mt-3 flex flex-col gap-3">
          <div><label className={rotulo}>Filiação / registro</label><input name="cavaloFiliacao" defaultValue={v?.cavaloFiliacao} placeholder="opcional" className={campoCad} autoComplete="off" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={rotulo}>Pai do cavalo</label><input name="cavaloPai" defaultValue={v?.cavaloPai} placeholder="opcional" className={campoCad} autoComplete="off" /></div>
            <div><label className={rotulo}>Mãe do cavalo</label><input name="cavaloMae" defaultValue={v?.cavaloMae} placeholder="opcional" className={campoCad} autoComplete="off" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={rotulo}>Tratador</label><input name="tratador" defaultValue={v?.tratador} placeholder="opcional" className={campoCad} autoComplete="off" /></div>
            <div><label className={rotulo}>Equipe</label><input name="equipe" defaultValue={v?.equipe} placeholder="opcional" className={campoCad} autoComplete="off" /></div>
          </div>
          {modo === "completo" && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={rotulo}>E-mail</label><input name="email" type="email" defaultValue={v?.email} placeholder="opcional" className={campoCad} /></div>
              <div><label className={rotulo}>Telefone</label><input name="telefone" type="tel" defaultValue={v?.telefone} placeholder="opcional" className={campoCad} /></div>
            </div>
          )}
        </div>
      </details>
    </>
  );
}
