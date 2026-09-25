import Image from "next/image";
import Link from "next/link";

/** Logo horizontal (escudo + nome) para cabeçalhos. */
export function MarcaHorizontal({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3" aria-label="EquiScore — início">
      <Image src="/brand/escudo-512.png" alt="" width={36} height={36} className="eqs-glow" priority />
      <span className="text-lg font-black tracking-tight">
        Equi<span className="text-eqs-red">Score</span>
        <span className="ml-2 rounded bg-eqs-red px-1.5 py-0.5 align-middle text-[10px] font-bold text-white">EQS</span>
      </span>
    </Link>
  );
}
