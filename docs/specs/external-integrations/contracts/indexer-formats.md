> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# C.6 Formats published by the indexer

**`index.json`** (GitHub Pages — the complete index, every entry with its full manifest; published for tooling, **never downloaded by Gladys**, see below):
```json
{
  "index_format": 1,
  "generated_at": "2026-07-13T08:00:00.000Z",
  "integrations": [
    {
      "store_slug": "john/gladys-open-meteo-demo",
      "repo_url": "https://github.com/john/gladys-open-meteo-demo",
      "entry_url": "https://<store-pages>/integrations/john--gladys-open-meteo-demo.json",
      "manifest": { "...": "full validated manifest (C.1)" },
      "cover_url": "https://<store-pages>/covers/john--gladys-open-meteo-demo.jpg",
      "docs": {
        "en": "https://<store-pages>/docs/john--gladys-open-meteo-demo/en.md",
        "fr": "https://<store-pages>/docs/john--gladys-open-meteo-demo/fr.md"
      },
      "github": { "stars": 12, "pushed_at": "2026-07-10T12:00:00.000Z", "owner_avatar_url": "https://..." },
      "categories": ["environment"],
      "countries": [],
      "first_seen_at": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

**`index-lite.json`** (same storage, same rebuild): the **same envelope and the same entries**, in the same order, with the `manifest` reduced to the fields the catalog list, the compatibility check and the update detection read — `manifest_version`, `type`, `name`, `description`, `version`, `docker_image`, `gladys_version`, `transports`, `keywords`, `countries` (the last three when declared — `keywords` feeds the catalog search and `countries` the country filter, `integration-catalog-categories.md` §4). Every entry-level field (`repo_url`, `entry_url`, `cover_url`, `docs`, `github`, `categories`, `countries`, `first_seen_at`) is kept. It exists because the full index carries every complete manifest (`config_schema`, scene declarations, widgets…): at 834 store integrations `index.json` weighs ~24 MB against ~1.4 MB for the lite one, and both grow linearly with the store.

**`integrations/<owner>--<repo>.json`** (same storage, same rebuild, one file per integration): **the complete entry of one integration** — exactly the object of `index.json` for that `store_slug`, with the same entry-level fields and the full manifest — a few kilobytes. Its URL is published as the **`entry_url`** of the entry, in both indexes, and follows the store layout: `integrations/` next to the indexes, file name `<owner>--<repo>.json` (the slug with `/` replaced by `--`, like the covers and docs folders). A `404` on it means the integration is not in the store.

Who reads which (B.9): Gladys refreshes, caches and serves its catalog from **`index-lite.json`**; when one complete manifest is needed — the install page of an integration, its install, its update — it downloads **the per-integration file** at the `entry_url` of the lite entry (derived from the store layout when the lite entry does not carry it, or when the lite index does not know the integration yet), checks it describes the requested `store_slug` and carries a manifest, and keeps only that entry. **Gladys never downloads `index.json`**: at the store's size it costs a multi-megabyte download for one manifest, and it only keeps growing. The core holds the lite manifest fields above in an explicit allowlist (`STORE_INDEX_LITE_MANIFEST_FIELDS`) and reduces any index it keeps for the catalog to it, so a full index is always a valid lite one (a fork that only serves its full index, a cache written by an older core) — only heavier to download. A field added to the lite manifest is ignored by cores that predate it, like the entry-level fields below.

Three entry-level fields feed the catalog navigation (`integration-catalog-categories.md`): **`categories`** — the manifest's `categories` when present and valid, else the entry of the fallback mapping file maintained in this repo (keyed by `store_slug`), else `[]` (uncategorized, author-facing warning in `rejected.json`), plus the **additions** of the same file (shelves added to the vocabulary after the manifest was written, appended to the declared keys, never replacing one) — **`countries`** — the manifest's `countries` when present, else the entry of the country fallback mapping file of this repo (keyed by `store_slug`), else `[]` (worldwide, no warning: it is the common case) — and **`first_seen_at`** — first indexing date of the `store_slug`, persisted across rebuilds and seeded on backfill from the repo `created_at`, else the first commit date, else the `generated_at` of the oldest index containing the slug (never `github.pushed_at`). Cores that predate these fields ignore them: their `getCatalog` projection copies an explicit list of entry fields.

**`rejected.json`** (public self-service diagnosis; `level: "error"` = not indexed, `level: "warning"` = indexed with degradation, e.g. cover replaced by a placeholder):
```json
[
  { "store_slug": "jane/my-integration", "level": "error", "reason": "manifest.version: must be valid semver", "checked_at": "2026-07-13T08:00:00.000Z" },
  { "store_slug": "bob/gladys-foo", "level": "warning", "reason": "cover_image: expected 800x534, got 1200x800 — placeholder used", "checked_at": "2026-07-13T08:00:00.000Z" }
]
```
