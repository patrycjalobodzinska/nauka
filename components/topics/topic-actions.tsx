"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { renameTopic, deleteTopic } from "@/actions/topics";

/** Zmiana nazwy / usunięcie własnego tematu. Po usunięciu wraca do `redirectTo`. */
export function TopicActions({
  id,
  title,
  redirectTo = "/dashboard",
}: {
  id: string;
  title: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          aria-label="Akcje tematu"
          disabled={pending}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            const next = window.prompt("Nowa nazwa tematu:", title);
            if (next == null) return;
            startTransition(async () => {
              const res = await renameTopic(id, next);
              if ("error" in res && res.error) toast.error(res.error);
              else {
                toast.success("Zmieniono nazwę");
                router.refresh();
              }
            });
          }}
        >
          <Pencil className="size-4" /> Zmień nazwę
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onSelect={(e) => {
            e.preventDefault();
            if (
              !window.confirm(
                `Usunąć „${title}" wraz z podtematami i materiałami?`
              )
            )
              return;
            startTransition(async () => {
              await deleteTopic(id);
              toast.success("Temat usunięty");
              router.push(redirectTo);
            });
          }}
        >
          <Trash2 className="size-4" /> Usuń
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
