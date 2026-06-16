import Link from "next/link";
import { BookOpen, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getContentTree, type ContentNode } from "@/lib/wnl/content-tree";

export const metadata = { title: "Pulpit" };

function countLessons(nodes: ContentNode[]): number {
  return nodes.reduce(
    (acc, n) => acc + (n.slideshowId != null ? 1 : 0) + countLessons(n.children),
    0
  );
}

export default async function DashboardPage() {
  const tree = getContentTree();
  const lessons = countLessons(tree);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dzień dobry 👋</h1>
        <p className="text-muted-foreground">Wiedza podstawowa — wybierz dziedzinę i ucz się.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <BookOpen className="size-4" /> Dziedziny
            </CardDescription>
            <CardTitle className="text-3xl">{tree.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <FileText className="size-4" /> Lekcje
            </CardDescription>
            <CardTitle className="text-3xl">{lessons}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Dziedziny</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tree.map((course) => (
            <Link key={course.slug} href={`/topics/${course.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardContent className="flex items-center gap-3 pt-4">
                  <span className="text-2xl">{course.emoji ?? "📚"}</span>
                  <div>
                    <div className="font-medium">{course.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {countLessons([course])} lekcji
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
