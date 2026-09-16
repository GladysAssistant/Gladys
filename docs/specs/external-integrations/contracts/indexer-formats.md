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

Two entry-level fields feed the catalog navigation (`integration-catalog-categories.md`): **`categories`** — the manifest's `categories` when present and valid, else the entry of the fallback mapping file maintained in this repo (keyed by `store_slug`), else `[]` (uncategorized, author-facing warning in `rejected.json`) — and **`first_seen_at`** — first indexing date of the `store_slug`, persisted across rebuilds and seeded on backfill from the repo `created_at`, else the first commit date, else the `generated_at` of the oldest index containing the slug (never `github.pushed_at`). Cores that predate these fields ignore them: their `getCatalog` projection copies an explicit list of entry fields.

**`rejected.json`** (public self-service diagnosis; `level: "error"` = not indexed, `level: "warning"` = indexed with degradation, e.g. cover replaced by a placeholder):
```json
[
  { "store_slug": "jane/my-integration", "level": "error", "reason": "manifest.version: must be valid semver", "checked_at": "2026-07-13T08:00:00.000Z" },
  { "store_slug": "bob/gladys-foo", "level": "warning", "reason": "cover_image: expected 800x534, got 1200x800 — placeholder used", "checked_at": "2026-07-13T08:00:00.000Z" }
]
```
