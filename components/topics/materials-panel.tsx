import { FileDropzone } from "@/components/files/file-dropzone";
import { AttachmentCard } from "@/components/files/attachment-card";
import { NotebookButton } from "@/components/topics/notebook-button";
import type { Attachment } from "@/db/schema";
import type { WnlRef } from "@/lib/constants";

/**
 * Panel materiałów węzła: lista załączników (PDF/obrazy) + wrzutnia plików +
 * przycisk notatnika. Dla węzła scrapowanego `topicId` może być null aż do
 * pierwszego wgrania — wtedy `wnl` służy do leniwego utworzenia kotwicy.
 */
export function MaterialsPanel({
  topicId,
  wnl,
  attachments,
}: {
  topicId: string | null;
  wnl: WnlRef | null;
  attachments: Attachment[];
}) {
  return (
    <div className="space-y-3">
      {attachments.length > 0 && (
        <ul className="grid gap-2 sm:grid-cols-2">
          {attachments.map((a) => (
            <li key={a.id}>
              <AttachmentCard attachment={a} />
            </li>
          ))}
        </ul>
      )}
      <FileDropzone topicId={topicId ?? undefined} wnl={wnl ?? undefined} />
      <div>
        <NotebookButton topicId={topicId} wnl={wnl} />
      </div>
    </div>
  );
}
