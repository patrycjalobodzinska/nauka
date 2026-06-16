/**
 * Dodatki kursu poza drzewem lekcji: atlas (galeria) + pytania (baza testowa).
 * Klucz = slug topicu-kursu (root). Pliki leżą w scripts/scrape/<dataDir>/.
 * Klient też to importuje (sam const, bez API serwerowych).
 */
export type CourseExtras = {
  /** plik atlasu w katalogu danych (np. "atlas.json") */
  atlas?: string;
  /** plik bazy pytań (np. "questions-29.json") */
  questions?: string;
  /** katalog danych pod scripts/scrape/ (domyślnie "_data") */
  dataDir?: string;
};

export const COURSE_EXTRAS: Record<string, CourseExtras> = {
  anatomia: { atlas: "atlas.json", questions: "questions-29.json", dataDir: "_data" },
};

export function courseExtras(slug: string): CourseExtras | undefined {
  return COURSE_EXTRAS[slug];
}
