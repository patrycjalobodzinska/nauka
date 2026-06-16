import { Suspense } from "react";
import { CourseTabs } from "@/components/wnl/course-tabs";

/**
 * Czytnik: bez edytora notatek. Na poziomie kursu z dodatkami pokazują się
 * zakładki Działy | Atlas | Pytania (CourseTabs sam się chowa dla zwykłych tematów).
 * usePathname w CourseTabs → własny Suspense, by layout został prerenderowalny.
 */
export default function TopicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
      <Suspense fallback={null}>
        <CourseTabs />
      </Suspense>
      {children}
    </div>
  );
}
