"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SidebarNavButton } from "@/components/layout/sidebar-nav-button";
import type { MergedNode } from "@/lib/topics";

/** Drzewo nawigacji: treść WNL (offline) scalona z kategoriami/tematami użytkownika. */
export function TopicTree({ nodes }: { nodes: MergedNode[] }) {
  if (nodes.length === 0) {
    return (
      <p className="px-2 py-1.5 text-xs text-muted-foreground">
        Brak treści — pobierz kursy skryptami w scripts/scrape.
      </p>
    );
  }
  return (
    <SidebarMenu>
      {nodes.map((node) => (
        <TopicItem key={node.slug} node={node} />
      ))}
    </SidebarMenu>
  );
}

function TopicItem({ node }: { node: MergedNode }) {
  const pathname = usePathname();
  const href = `/topics/${node.slug}`;
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  const hasChildren = node.children.length > 0;

  const button = (
    <SidebarNavButton href={href} isActive={isActive} className="min-h-10">
      <span className="w-5 text-center">
        {node.emoji ?? (node.slideshowId != null ? "📄" : "📁")}
      </span>
      <span className="truncate">{node.title}</span>
      {node.custom && (
        <Badge
          variant="secondary"
          className="ml-auto h-4 shrink-0 px-1 text-[10px] leading-none"
        >
          dodatkowy
        </Badge>
      )}
    </SidebarNavButton>
  );

  if (!hasChildren) {
    return <SidebarMenuItem>{button}</SidebarMenuItem>;
  }

  return (
    <Collapsible defaultOpen={isActive} className="group/collapsible">
      <SidebarMenuItem>
        {button}
        <CollapsibleTrigger asChild>
          <SidebarMenuAction className="data-[state=open]:rotate-90 transition-transform">
            <ChevronRight />
          </SidebarMenuAction>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {node.children.map((child) => (
              <SidebarMenuSubItem key={child.slug}>
                <TopicItem node={child} />
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
