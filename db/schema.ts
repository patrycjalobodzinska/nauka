import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sectionEnum = pgEnum("section", [
  "theory",
  "practice",
  "medical_extension",
]);

export const noteKindEnum = pgEnum("note_kind", ["text", "canvas", "mixed"]);

/* ---------- Users (single-user now, auth-ready later) ---------- */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ---------- Hierarchical topic tree (the sidebar) ---------- */
export const topics = pgTable(
  "topics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => topics.id, {
      onDelete: "cascade",
    }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    emoji: text("emoji"),
    /** Liść = lekcja: id slideshowu WNL (scripts/scrape/_data/slideshow-<id>.json). null = folder (kurs/region). */
    slideshowId: integer("slideshow_id"),
    /**
     * Kotwica do węzła scrapowanego (offline content-tree). Gdy ustawione, ten
     * wiersz NIE jest renderowany jako osobny węzeł — istnieje tylko po to, by
     * powiązać materiały/podtematy użytkownika z istniejącym tematem WNL
     * (np. "anatomia-embriologia"). null = węzeł utworzony przez użytkownika.
     */
    wnlSlug: text("wnl_slug"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("topics_user_slug_idx").on(t.userId, t.slug),
    uniqueIndex("topics_user_wnl_slug_idx").on(t.userId, t.wnlSlug),
    index("topics_parent_idx").on(t.parentId),
  ]
);

/* ---------- Notes: one per (topic, section), tldraw-aware ---------- */
export type NoteContent = {
  blocks: unknown[];
  canvas: unknown | null; // tldraw TLStoreSnapshot
};

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    section: sectionEnum("section").notNull(),
    kind: noteKindEnum("kind").notNull().default("mixed"),
    title: text("title").notNull().default(""),
    content: jsonb("content").$type<NoteContent>(),
    position: integer("position").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("notes_topic_section_idx").on(t.topicId, t.section)]
);

/* ---------- Files: Vercel Blob pointers, linked to topic or note ---------- */
export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    topicId: uuid("topic_id").references(() => topics.id, {
      onDelete: "cascade",
    }),
    noteId: uuid("note_id").references(() => notes.id, {
      onDelete: "cascade",
    }),
    blobUrl: text("blob_url").notNull(),
    pathname: text("pathname").notNull(), // needed for del()
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("attachments_topic_idx").on(t.topicId),
    index("attachments_note_idx").on(t.noteId),
  ]
);

/* ---------- Flashcards: decks per topic, Leitner-ready cards ---------- */
export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicId: uuid("topic_id")
    .notNull()
    .references(() => topics.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const flashcards = pgTable(
  "flashcards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    hint: text("hint"),
    box: integer("box").notNull().default(1), // Leitner box 1–5
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    lapses: integer("lapses").notNull().default(0),
    suspended: boolean("suspended").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("flashcards_deck_due_idx").on(t.deckId, t.dueAt)]
);

/* ---------- Relations ---------- */
export const usersRelations = relations(users, ({ many }) => ({
  topics: many(topics),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  user: one(users, { fields: [topics.userId], references: [users.id] }),
  parent: one(topics, {
    fields: [topics.parentId],
    references: [topics.id],
    relationName: "tree",
  }),
  children: many(topics, { relationName: "tree" }),
  notes: many(notes),
  decks: many(decks),
  attachments: many(attachments),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  topic: one(topics, { fields: [notes.topicId], references: [topics.id] }),
  attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  topic: one(topics, {
    fields: [attachments.topicId],
    references: [topics.id],
  }),
  note: one(notes, { fields: [attachments.noteId], references: [notes.id] }),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  topic: one(topics, { fields: [decks.topicId], references: [topics.id] }),
  cards: many(flashcards),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  deck: one(decks, { fields: [flashcards.deckId], references: [decks.id] }),
}));

export type Topic = typeof topics.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Attachment = typeof attachments.$inferSelect;
export type Deck = typeof decks.$inferSelect;
export type Flashcard = typeof flashcards.$inferSelect;
export type Section = (typeof sectionEnum.enumValues)[number];
