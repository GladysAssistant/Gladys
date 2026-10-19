> Part of the [external integrations living spec](../README.md) — the layout, the editing rules and the cross-repo map are there.

# C.6 Formats published by the indexer

**`index.json`** (GitHub Pages, consumed by every Gladys):
```json
{
  "index_format": 1,
  "generated_at": "2026-07-13T08:00:00.000Z",
  "integrations": [
    {
      "store_slug": "john/gladys-open-meteo-demo",
      "repo_url": "https://github.com/john/gladys-open-meteo-demo",
      "manifest": { "...": "full validated manifest (C.1)" },
      "cover_url": "https://<store-pages>/covers/john--gladys-open-meteo-demo.jpg",
      "docs": {
        "en": "https://<store-pages>/docs/john--gladys-open-meteo-demo/en.md",
        "fr": "https://<store-pages>/docs/john--gladys-open-meteo-demo/fr.md"
      },
      "github": { "stars": 12, "pushed_at": "2026-07-10T12:00:00.000Z", "owner_avatar_url": "https://..." },
      "categories": ["environment"],
      "first_seen_at": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

**`index-lite.json`** (same storage, same rebuild): the **same envelope and the same entries**, in the same order, with the `manifest` reduced to the fields the catalog list, the compatibility check and the update detection read — `manifest_version`, `type`, `name`, `description`, `version`, `docker_image`, `gladys_version`, `transports` (when declared). Every entry-level field (`repo_url`, `cover_url`, `docs`, `github`, `categories`, `first_seen_at`) is kept. It exists because the full index carries every complete manifest (`config_schema`, scene declarations, widgets…): at 585 store integrations `index.json` weighs ~17 MB (~2.7 MB gzipped) against ~0.9 MB (~120 KB gzipped) for the lite one, and both grow linearly with the store.

Who reads which (B.9): Gladys refreshes, caches and serves its catalog from **`index-lite.json`**; it downloads **`index.json`** only when one complete manifest is needed — the install page of an integration, its install, its update — and keeps only that entry. The core holds the lite manifest fields above in an explicit allowlist (`STORE_INDEX_LITE_MANIFEST_FIELDS`) and reduces any index it keeps for the catalog to it, so a full index is always a valid lite one (a fork without lite variant, a cache written by an older core) — only heavier to download. A field added to the lite manifest is ignored by cores that predate it, like the entry-level fields below.

Two entry-level fields feed the catalog navigation (`integration-catalog-categories.md`): **`categories`** — the manifest's `categories` when present and valid, else the entry of the fallback mapping file maintained in this repo (keyed by `store_slug`), else `[]` (uncategorized, author-facing warning in `rejected.json`) — and **`first_seen_at`** — first indexing date of the `store_slug`, persisted across rebuilds and seeded on backfill from the repo `created_at`, else the first commit date, else the `generated_at` of the oldest index containing the slug (never `github.pushed_at`). Cores that predate these fields ignore them: their `getCatalog` projection copies an explicit list of entry fields.

**`rejected.json`** (public self-service diagnosis; `level: "error"` = not indexed, `level: "warning"` = indexed with degradation, e.g. cover replaced by a placeholder):
```json
[
  { "store_slug": "jane/my-integration", "level": "error", "reason": "manifest.version: must be valid semver", "checked_at": "2026-07-13T08:00:00.000Z" },
  { "store_slug": "bob/gladys-foo", "level": "warning", "reason": "cover_image: expected 800x534, got 1200x800 — placeholder used", "checked_at": "2026-07-13T08:00:00.000Z" }
]
```
