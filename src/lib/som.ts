"use client";
/**
 * Efeitos sonoros sutis via Web Audio (sem arquivos, seguro em serverless).
 * Tons curtos e discretos — nada de neon. Respeita a preferência do usuário
 * gravada em localStorage e o "prefers-reduced-motion".
 */

const CHAVE = "eqs_som";

export function somLigado(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(CHAVE) !== "0";
  } catch {
    return true;
  }
}

const ouvintes = new Set<() => void>();

export function definirSom(ligado: boolean) {
  try {
    localStorage.setItem(CHAVE, ligado ? "1" : "0");
  } catch {
    /* ignora */
  }
  ouvintes.forEach((f) => f());
}

/** Assina mudanças na preferência de som (para useSyncExternalStore). */
export function assinarSom(cb: () => void): () => void {
  ouvintes.add(cb);
  return () => ouvintes.delete(cb);
}

/** Snapshot para o cliente. */
export const lerSomCliente = () => somLigado();
/** Snapshot para o servidor (padrão: ligado). */
export const lerSomServidor = () => true;

let ctx: AudioContext | null = null;
function contexto(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/** Toca uma sequência de notas curtas e suaves. */
function tocar(notas: { freq: number; inicio: number; dur: number; vol?: number }[]) {
  if (!somLigado()) return;
  const c = contexto();
  if (!c) return;
  const agora = c.currentTime;
  for (const n of notas) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = n.freq;
    const t0 = agora + n.inicio;
    const pico = n.vol ?? 0.09;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(pico, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + n.dur + 0.02);
  }
}

/** Confirmação leve (salvar rascunho, ação simples). */
export const somClique = () => tocar([{ freq: 660, inicio: 0, dur: 0.09, vol: 0.05 }]);

/** Sucesso (folha finalizada, inscrição aceita) — dois tons ascendentes. */
export const somSucesso = () => tocar([
  { freq: 587.33, inicio: 0, dur: 0.14 },
  { freq: 880, inicio: 0.09, dur: 0.2 },
]);

/** Publicação de resultados — tríade curta e discreta. */
export const somPublicar = () => tocar([
  { freq: 523.25, inicio: 0, dur: 0.13 },
  { freq: 659.25, inicio: 0.08, dur: 0.13 },
  { freq: 783.99, inicio: 0.16, dur: 0.24 },
]);

/** Aviso/erro — tom grave curto. */
export const somAviso = () => tocar([{ freq: 311.13, inicio: 0, dur: 0.18, vol: 0.07 }]);
