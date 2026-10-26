import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { decodePreferences, filterCatalog } from "../src/lib/preferences.ts";

const snapshot = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.v1.json", import.meta.url)),
);
const assets = JSON.parse(
  fs.readFileSync(new URL("../src/data/asset-manifest.json", import.meta.url)),
);
const items = snapshot.items;

test("catalog contains exactly 24 distinct Hongguo dramas in the approved categories", () => {
  assert.equal(items.length, 24);
  assert.equal(new Set(items.map((x) => x.id)).size, 24);
  assert.deepEqual(
    Object.fromEntries(
      ["real", "comic", "ai"].map((type) => [
        type,
        items.filter((x) => x.type === type).length,
      ]),
    ),
    { real: 12, comic: 6, ai: 6 },
  );
  for (const drama of items) {
    const source = new URL(drama.sourceUrl);
    assert.equal(source.hostname, "hongguoduanju.com");
    assert.equal(source.pathname, "/detail");
    assert.equal(source.searchParams.get("series_id"), drama.id);
    assert.equal(
      drama.categorySource,
      `https://hongguoduanju.com/category/${{ real: "real-drama", comic: "comic-drama", ai: "ai-drama" }[drama.type]}`,
    );
    assert.ok(
      drama.title &&
        drama.description &&
        drama.posterSource &&
        drama.capturedAt,
    );
    assert.ok(
      drama.platformScore === null ||
        (drama.platformScore >= 0 && drama.platformScore <= 10),
    );
  }
});

test("all real posters are present with verified local checksums and WebP dimensions", () => {
  assert.equal(assets.length, 24);
  for (const drama of items) {
    const asset = assets.find((x) => x.id === drama.id);
    const bytes = fs.readFileSync(
      new URL(`../public${drama.poster}`, import.meta.url),
    );
    assert.equal(asset.source, drama.posterSource);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      asset.sha256,
    );
    assert.equal(bytes.subarray(8, 12).toString(), "WEBP");
    assert.ok(asset.width > 400 && asset.height > asset.width);
  }
});

test("snapshot ranks preserve the original platform order; missing scores stay null", () => {
  const ranking = items
    .filter((x) => x.type === "real")
    .sort((a, b) => a.rank - b.rank);
  assert.deepEqual(
    ranking.map((x) => x.rank),
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  assert.equal(ranking[0].title, "王妈在顾家当保姆后全家只会搞笑了");
  assert.ok(
    items.filter((x) => x.type === "ai").every((x) => x.platformScore === null),
  );
});

test("search combines title, type and exact genre, with whitespace trimming", () => {
  assert.equal(
    filterCatalog(items, "  枝头  ", "real", "爱情")[0].title,
    "枝头春意闹",
  );
  assert.equal(filterCatalog(items, "枝头", "comic", "全部题材").length, 0);
  assert.equal(filterCatalog(items, "", "ai", "全部题材").length, 6);
  assert.equal(filterCatalog(items, "", "all", "全部题材").length, 24);
  assert.equal(
    filterCatalog(items, "不存在的剧集", "all", "全部题材").length,
    0,
  );
});

test("local ratings, statuses and Unicode reviews survive a storage round trip", () => {
  const id = items[0].id;
  const entries = {
    [id]: { status: "watched", rating: 4, review: "值得回味。\n下次再看！" },
  };
  const raw = JSON.stringify({ version: 1, items: entries });
  assert.deepEqual(decodePreferences(raw, [id]), entries);
});

test("invalid, stale and unknown storage records cannot enter the active catalog", () => {
  assert.deepEqual(decodePreferences("{broken", ["known"]), {});
  assert.deepEqual(
    decodePreferences(JSON.stringify({ version: 2, items: {} }), ["known"]),
    {},
  );
  assert.deepEqual(
    decodePreferences(
      JSON.stringify({ version: 1, items: { unknown: { rating: 5 } } }),
      ["known"],
    ),
    {},
  );
  const decoded = decodePreferences(
    JSON.stringify({
      version: 1,
      items: {
        known: { status: "published", rating: 9, review: "字".repeat(700) },
      },
    }),
    ["known"],
  );
  assert.equal(decoded.known.status, null);
  assert.equal(decoded.known.rating, 0);
  assert.equal(decoded.known.review.length, 500);
});
