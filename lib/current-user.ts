import { db } from "@/db";
import { users } from "@/db/schema";

const DEFAULT_EMAIL = "patrycja.lobodzinska@cetuspro.com";

/**
 * Single-user mode: returns the one seeded user, creating it if missing.
 * Swap this for an Auth.js session lookup when auth lands — every query
 * in the app already keys off the returned id.
 */
export async function getCurrentUser() {
  const existing = await db.query.users.findFirst();
  if (existing) return existing;

  const [created] = await db
    .insert(users)
    .values({ email: DEFAULT_EMAIL, name: "Patrycja" })
    .onConflictDoNothing()
    .returning();
  if (created) return created;

  const after = await db.query.users.findFirst();
  if (!after) throw new Error("Failed to bootstrap default user");
  return after;
}
