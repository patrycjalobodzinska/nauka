import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { getTopicBySlug, getUserChildren } from "@/lib/topics";
import { getTopicAttachments } from "@/lib/notes";
import { NodeDbSection } from "@/components/topics/node-db-section";
import { TopicActions } from "@/components/topics/topic-actions";

/** Strona węzła utworzonego przez użytkownika (kategoria/podkategoria/temat). */
export async function UserTopicView({ slug }: { slug: string }) {
  const user = await getCurrentUser();
  const node = await getTopicBySlug(user.id, slug);
  if (!node || node.wnlSlug) notFound(); // kotwice nie są nawigowalne

  const childrenNodes = await getUserChildren(user.id, node.id);
  const attachments = await getTopicAttachments(node.id);

  return (
    <>
      <header className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">
          {node.emoji ? `${node.emoji} ` : ""}
          {node.title}
        </h1>
        <TopicActions id={node.id} title={node.title} />
      </header>

      <NodeDbSection
        parentTitle={node.title}
        create={{ parentId: node.id }}
        childrenNodes={childrenNodes.map((c) => ({
          slug: c.slug,
          title: c.title,
          emoji: c.emoji,
        }))}
        materials={{ topicId: node.id, wnl: null }}
        attachments={attachments}
      />
    </>
  );
}
