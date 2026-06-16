import { Skeleton } from "@/components/ui/skeleton";

export default function TopicLoading() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="min-h-[55dvh] flex-1 rounded-xl" />
    </div>
  );
}
