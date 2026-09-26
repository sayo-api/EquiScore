import { Barra, ListaSkeleton } from "@/components/skeleton";
export default function Loading() {
  return (
    <div>
      <Barra w="40%" h={26} />
      <div className="mt-5"><ListaSkeleton linhas={4} /></div>
    </div>
  );
}
