import type { Drama, DramaType } from "./types";

export type Entry = {
  status: "wish" | "watched" | null;
  rating: number;
  review: string;
};
export type Preferences = Record<string, Entry>;
export const STORAGE_KEY = "hongdouban:preferences:v1";
export const EMPTY_ENTRY: Entry = { status: null, rating: 0, review: "" };

export function decodePreferences(
  raw: string | null,
  ids: string[],
): Preferences {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      value.version !== 1 ||
      !("items" in value) ||
      !value.items ||
      typeof value.items !== "object"
    )
      return {};
    const result: Preferences = {};
    for (const id of ids) {
      const entry = (value.items as Record<string, unknown>)[id];
      if (!entry || typeof entry !== "object") continue;
      const e = entry as Partial<Entry>;
      result[id] = {
        status: e.status === "wish" || e.status === "watched" ? e.status : null,
        rating:
          typeof e.rating === "number" &&
          Number.isInteger(e.rating) &&
          e.rating >= 0 &&
          e.rating <= 5
            ? e.rating
            : 0,
        review: typeof e.review === "string" ? e.review.slice(0, 500) : "",
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function filterCatalog(
  items: Drama[],
  query: string,
  type: DramaType | "all",
  tag: string,
): Drama[] {
  const needle = query.trim().toLocaleLowerCase("zh-CN");
  return items.filter(
    (item) =>
      (type === "all" || item.type === type) &&
      (tag === "全部题材" || item.tags.includes(tag)) &&
      (!needle || item.title.toLocaleLowerCase("zh-CN").includes(needle)),
  );
}
