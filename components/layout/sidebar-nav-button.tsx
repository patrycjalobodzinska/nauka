"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { SidebarMenuButton, useSidebar } from "@/components/ui/sidebar";

/**
 * Przycisk nawigacyjny menu bocznego. Po wybraniu (kliknięciu) zamyka menu
 * boczne na urządzeniach mobilnych — na desktopie panel pozostaje otwarty.
 */
export function SidebarNavButton({
  href,
  children,
  ...props
}: { href: string } & ComponentProps<typeof SidebarMenuButton>) {
  const { isMobile, setOpenMobile } = useSidebar();
  return (
    <SidebarMenuButton asChild {...props}>
      <Link
        href={href}
        onClick={() => {
          if (isMobile) setOpenMobile(false);
        }}
      >
        {children}
      </Link>
    </SidebarMenuButton>
  );
}
