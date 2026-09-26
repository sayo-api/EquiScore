import { Barra } from "@/components/skeleton";
export default function Loading() {
  return (
    <div>
      <Barra w="30%" h={28} />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-xl border border-line bg-surf" />)}
      </div>
    </div>
  );
}
