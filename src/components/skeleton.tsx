/** Blocos de carregamento (shimmer suave) para os loading.tsx das rotas. */
export function Barra({ w = "100%", h = 16, className = "" }: { w?: string | number; h?: number; className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line2 ${className}`} style={{ width: w, height: h }} />;
}

export function ListaSkeleton({ linhas = 6 }: { linhas?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surf shadow-sm">
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-line2 px-4 py-3.5 first:border-0">
          <div className="size-9 animate-pulse rounded-lg bg-line2" />
          <div className="flex-1 space-y-2">
            <Barra w="45%" h={12} />
            <Barra w="30%" h={10} />
          </div>
          <Barra w={70} h={22} className="rounded-full" />
        </div>
      ))}
    </div>
  );
}
