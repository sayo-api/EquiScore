import "server-only";

/** Lê os campos de cadastro do conjunto de um FormData (padrão do sistema antigo). */
export function camposDoForm(form: FormData) {
  const t = (k: string) => String(form.get(k) || "").trim();
  return {
    nome: t("nome"),
    cavalo: t("cavalo"),
    postoGraduacao: t("postoGraduacao"),
    categoria: t("categoria") || "Geral",
    cavaloFiliacao: t("cavaloFiliacao"),
    cavaloPai: t("cavaloPai"),
    cavaloMae: t("cavaloMae"),
    tratador: t("tratador"),
    equipe: t("equipe"),
    email: t("email"),
    telefone: t("telefone"),
  };
}
