import { NewTopicDialog } from "@/components/layout/new-topic-dialog";
import { ChildrenGrid } from "@/components/topics/children-grid";
import { MaterialsPanel } from "@/components/topics/materials-panel";
import type { Attachment } from "@/db/schema";
import type { WnlRef } from "@/lib/constants";

/**
 * Wspólna sekcja „z bazy" pod każdym tematem: własne podtematy (tematy dodatkowe)
 * z przyciskiem dodawania oraz panel materiałów. Używane zarówno dla węzłów
 * scrapowanych (rodzic = parentWnl), jak i własnych (rodzic = parentId).
 */
export function NodeDbSection({
  parentTitle,
  create,
  childrenNodes,
  materials,
  attachments,
}: {
  parentTitle: string;
  create: { parentId?: string; parentWnl?: WnlRef };
  childrenNodes: { slug: string; title: string; emoji: string | null }[];
  materials: { topicId: string | null; wnl: WnlRef | null };
  attachments: Attachment[];
}) {
  return (
    <div className="mt-10 space-y-8 border-t pt-6">
      <section>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-muted-foreground">
            Tematy dodatkowe
          </h2>
          <NewTopicDialog
            parentId={create.parentId}
            parentWnl={create.parentWnl}
            parentTitle={parentTitle}
            triggerLabel="Dodaj temat"
          />
        </div>
        {childrenNodes.length > 0 ? (
          <ChildrenGrid
            nodes={childrenNodes.map((c) => ({
              ...c,
              slideshowId: null,
              custom: true,
            }))}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Brak własnych podtematów — dodaj pierwszy przyciskiem powyżej.
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-muted-foreground">
          Materiały
        </h2>
        <MaterialsPanel
          topicId={materials.topicId}
          wnl={materials.wnl}
          attachments={attachments}
        />
      </section>
    </div>
  );
}
