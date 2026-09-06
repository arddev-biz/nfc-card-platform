/**
 * Converts arbitrary text into a URL-safe slug: lowercase, hyphenated,
 * accents stripped, trimmed to a sane length. Used both when the admin
 * leaves the slug field blank (auto-generate from business name) and to
 * normalize a slug the admin typed manually.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accent marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
