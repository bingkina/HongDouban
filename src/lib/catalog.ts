import snapshot from "@/data/catalog.v1.json";
import type { Catalog } from "./types";

// The UI depends on this boundary, not on how the catalog is collected.
export function getCatalog(): Catalog {
  return snapshot as Catalog;
}
