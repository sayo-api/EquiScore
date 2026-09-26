import { Barra, ListaSkeleton } from "@/components/skeleton";
export default function Loading() {
  return (
    <div>
      <Barra w={90} h={12} />
      <div className="mt-3"><Barra w="40%" h={28} /></div>
      <div className="mt-6"><ListaSkeleton /></div>
    </div>
  );
}
