import { Skeleton } from "@/components/ui/skeleton";

export default function FocusLoading() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-10 w-24" />
      </div>
      <Skeleton className="flex-1 rounded-xl" />
    </div>
  );
}
