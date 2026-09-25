import Image from "next/image";
import Link from "next/link";

export function MarcaHorizontal({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="EquiScore — início">
      <Image src="/brand/escudo-512.png" alt="" width={32} height={32} priority />
      <span className="text-[17px] font-extrabold tracking-tight">
        Equi<span className="text-red">Score</span>
      </span>
      <span className="ml-1 rounded bg-red px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">EQS</span>
    </Link>
  );
}
