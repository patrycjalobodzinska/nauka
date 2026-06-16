"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Images, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { courseExtras } from "@/lib/wnl/course-extras";

/**
 * Zakładki na poziomie KURSU: Działy (drzewo lekcji) | Atlas | Pytania.
 * Pokazują się tylko gdy slug w URL to kurs z dodatkami (COURSE_EXTRAS).
 * Slug bierzemy z pathname, żeby layout pozostał statyczny (Cache Components).
 */
export function CourseTabs() {
  const pathname = usePathname();
  const parts = pathname.split("/"); // ["", "topics", "<slug>", "<sub?>"]
  const slug = parts[2] ?? "";
  const sub = parts[3] ?? "";
  const extras = courseExtras(slug);
  if (!extras) return null;

  const tabs = [
    { href: `/topics/${slug}`, key: "", label: "Działy", icon: BookOpen, show: true },
    { href: `/topics/${slug}/atlas`, key: "atlas", label: "Atlas", icon: Images, show: !!extras.atlas },
    { href: `/topics/${slug}/pytania`, key: "pytania", label: "Pytania", icon: ListChecks, show: !!extras.questions },
  ].filter((t) => t.show);

  return (
    <nav className="flex w-full gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
      {tabs.map((tab) => {
        const active = sub === tab.key;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
