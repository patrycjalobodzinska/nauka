import { Suspense } from "react";
import { Microscope, LayoutDashboard } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { TopicTree } from "@/components/layout/topic-tree";
import { SidebarNavButton } from "@/components/layout/sidebar-nav-button";
import { NewTopicDialog } from "@/components/layout/new-topic-dialog";
import { getMergedTreeSafe } from "@/lib/topics";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarNavButton href="/dashboard" size="lg">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Microscope className="size-4" />
              </span>
              <span className="font-semibold tracking-tight">
                Nauka · Biologia
              </span>
            </SidebarNavButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarNavButton href="/dashboard">
                  <LayoutDashboard />
                  <span>Pulpit</span>
                </SidebarNavButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <div className="flex items-center justify-between pr-1">
            <SidebarGroupLabel>Kursy i kategorie</SidebarGroupLabel>
            <NewTopicDialog />
          </div>
          <SidebarGroupContent>
            <Suspense fallback={<TopicTreeSkeleton />}>
              <TopicsLoader />
            </Suspense>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

async function TopicsLoader() {
  return <TopicTree nodes={await getMergedTreeSafe()} />;
}

// Deterministic widths — SidebarMenuSkeleton uses Math.random(),
// which Cache Components forbids in prerendered Suspense fallbacks.
const SKELETON_WIDTHS = ["72%", "55%", "80%", "64%", "70%", "58%"];

function TopicTreeSkeleton() {
  return (
    <SidebarMenu>
      {SKELETON_WIDTHS.map((width, i) => (
        <SidebarMenuItem key={i} className="flex h-8 items-center gap-2 px-2">
          <Skeleton className="size-4 rounded-md" />
          <Skeleton className="h-4 flex-1" style={{ maxWidth: width }} />
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
