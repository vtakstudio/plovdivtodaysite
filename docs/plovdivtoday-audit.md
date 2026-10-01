# PlovdivToday installation audit

Audit date: 1 October 2026. Original state inspected before implementation using repository files and the connected EmDash MCP tools.

## Current State

- EmDash 1.0.1, Astro 7, Cloudflare adapter 14, React 19; pnpm 11.9.0. No lint or test script. Build, typecheck, dev, preview and deploy scripts exist.
- Server-rendered English blog template with home, posts, post detail, pages, category, tag, search, RSS and 404 routes. Inter and JetBrains Mono are handled by Astro's font pipeline.
- Connected MCP targets **local** EmDash at http://localhost:4321. The local CMS has posts and pages with drafts, revisions, preview, search and SEO; posts also support scheduling and comments.
- Eight original posts (seven published, one draft), seven stock sample images, two template bylines, English category/tag taxonomies and a three-item English primary menu.
- Site title was “My Blog”, tagline “Thoughts on building for the web”. No logo, favicon, canonical URL or SEO defaults were configured in settings.
- Supplied assets: square/round logos, two wide logo variants, a golden Plovdiv panorama and two sample JPGs. Owner supplied colours: #FFF0E3, #FEF6EF, #F3DFCE, #201D1D, #262B33, #3481AE.

## Problems / Missing Configuration

- No Bulgarian article model, newsroom navigation, locations, editorial byline or publication templates.
- Template enables comments; comments are outside this milestone.
- Public production URL is absent from repository settings; `.dev.vars` explicitly sets localhost. Do not infer a domain.
- Wrangler authentication has expired and cannot refresh in this non-interactive session. Production CMS state and deployment cannot yet be inspected. Local D1 state is not evidence of production state.

## Decisions Made

- Add a single articles collection with native lifecycle, SEO and bylines; preserve original template data rather than deleting it.
- Use native category/location taxonomies and menus. Bulgarian is the publication language; no English public edition is planned.
- Use supplied assets and palette, Inter with Cyrillic support, server-rendered editorial components and a small site-level SEO hook.
- Keep prelaunch indexing disabled and visibly identify demo content. Use native robots settings plus page metadata.
- Backed up local D1 with SQLite's online backup API before changes to `.local-backups/before-plovdivtoday.sqlite` (ignored; contains private site data).

## Important Existing Infrastructure

- Preserve Cloudflare Worker `plovdivtodaysite`, D1 binding `DB` / database `plovdivtodaydb` (e7d243fc-4104-442e-8bb0-cee1ce3fff87), R2 binding `MEDIA` / bucket `plovdivtodayr2`.
- Preserve src/worker.ts, PluginBridge export and minute maintenance cron. No Worker Loader is configured; isolated plugins would require additional platform setup.
- Keep `output: server`, native EmDash middleware/admin/API routes, src/live.config.ts, OAuth/passkey setup and secrets intact.
- Existing uncommitted skills, AGENTS.md, configuration and owner assets predate this work and must not be reverted.

## Production inspection (after access was restored)

- Owner confirmed https://plovdivtodaysite.estudio-5ba.workers.dev as the current public deployment. Wrangler OAuth was refreshed successfully.
- Production was still at the native setup wizard, with posts/pages schema but zero posts and no completed admin setup. No existing production reporting was replaced.
- D1 SQL export fails because EmDash has FTS5 virtual tables. Recorded a native D1 Time Travel bookmark instead in `.local-backups/production-time-travel-before.json`; this is the production recovery point.
- Initial foundation build deployed successfully to the same Worker, D1, R2, KV session and image bindings, with its existing minute cron. Added the explicit EMDASH_SITE_URL variable required for safe production setup.
- Used the native setup endpoint to apply the new seed in bounded requests. Ten articles, eleven fields, nine category terms, twelve hierarchical location terms, Bulgarian navigation and editorial byline now exist in production.
- Setup preserved existing site settings and the supplied-image downloads initially did not create media-library records. These were subsequently repaired through authenticated native admin/API. The owner completed account/passkey creation; no credential was invented.

## Final production state

Owner authentication and the native CLI connection are complete. Production identity, timezone, canonical URL, supplied logos/favicon/social image, Bulgarian editorial byline, five native media records, article references and navigation were finalized. The original template collections remain recoverable but no longer publish English template routes or comments. The real production editor workflow and responsive/SEO checks passed; see `plovdivtoday-foundation.md` for acceptance evidence and prelaunch instructions. Production intentionally remains visibly DEMO and blocked from indexing.
