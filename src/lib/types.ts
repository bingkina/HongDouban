export type DramaType = "real" | "comic" | "ai";

export interface Drama {
  id: string;
  title: string;
  type: DramaType;
  poster: string;
  posterSource: string;
  description: string | null;
  tags: string[];
  episodes: number | null;
  episodeLabel: string | null;
  cast: string[];
  platformScore: number | null;
  rank: number | null;
  heat: string | null;
  sourceUrl: string;
  categorySource: string;
  rankSource: string;
  capturedAt: string;
}

export interface Catalog {
  version: number;
  capturedAt: string;
  source: string;
  items: Drama[];
}
