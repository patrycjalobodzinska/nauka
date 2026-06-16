import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "Brak DATABASE_URL — ustaw zmienną środowiskową, by korzystać z bazy (notatki/materiały)."
    );
  }
  return drizzle(neon(url), { schema });
}

type DB = ReturnType<typeof createDb>;

/**
 * Leniwe połączenie: `neon()` NIE jest wołane przy imporcie modułu, więc
 * `next build` i przeglądanie offline działają bez DATABASE_URL. Połączenie
 * powstaje przy pierwszym zapytaniu; brak zmiennej rzuca błąd dopiero wtedy —
 * łapie go getMergedTreeSafe() i wraca do trybu offline.
 */
let instance: DB | null = null;

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    if (!instance) instance = createDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});
