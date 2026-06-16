import { getCurrentUser } from "@/lib/current-user";
import { getAnchorByWnlSlug, getUserChildren } from "@/lib/topics";
import { getTopicAttachments } from "@/lib/notes";
import { NodeDbSection } from "@/components/topics/node-db-section";
import type { WnlRef } from "@/lib/constants";

/**
 * Część „z bazy" strony tematu scrapowanego (offline). Renderowana w <Suspense>,
 * by treść WNL pojawiała się natychmiast. Kotwica jest czytana, a nie tworzona —
 * powstaje dopiero przy pierwszym dodaniu materiału/podtematu.
 */
export async function TopicExtras({ wnl }: { wnl: WnlRef }) {
  try {
    const user = await getCurrentUser();
    const anchor = await getAnchorByWnlSlug(user.id, wnl.slug);
    const childrenNodes = anchor ? await getUserChildren(user.id, anchor.id) : [];
    const attachments = anchor ? await getTopicAttachments(anchor.id) : [];

    return (
      <NodeDbSection
        parentTitle={wnl.title}
        create={{ parentWnl: wnl }}
        childrenNodes={childrenNodes.map((c) => ({
          slug: c.slug,
          title: c.title,
          emoji: c.emoji,
        }))}
        materials={{ topicId: anchor?.id ?? null, wnl }}
        attachments={attachments}
      />
    );
  } catch {
    return (
      <p className="mt-10 border-t pt-6 text-sm text-muted-foreground">
        Materiały i własne tematy są chwilowo niedostępne (brak połączenia z bazą).
      </p>
    );
  }
}
