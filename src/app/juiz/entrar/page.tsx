import { redirect } from "next/navigation";

// O login do juiz agora é o mesmo do site: ao entrar com credenciais de juiz,
// o sistema envia direto ao painel do juiz. Mantido apenas por compatibilidade.
export default function EntrarJuizLegado() {
  redirect("/entrar");
}
