# PlovdivToday foundation

## Architecture

Astro server rendering with EmDash 1.0.1 on the existing Cloudflare Worker. D1 remains the content database; R2 remains the media store. The existing worker scheduled handler and minute cron are preserved. No new dependency, ingestion system, Events collection, analytics, advertisements or client framework was added for the public frontend.

- `src/layouts/Newsroom.astro`: Bulgarian HTML shell, native settings/menu queries, EmDash page-head/body integration, native disclosure mobile navigation, footer and indexing state.
- `src/components/StoryCard.astro`: lead, standard, compact and weekend variants. The latest feed is a chronological row presentation.
- `src/components/Archive.astro`: shared section/location/latest listing with native cursor pagination.
- `src/components/LocationTree.astro`: recursive links to native location terms.
- `src/components/ArticleBlock.astro`: H2 anchors for the article gutter. All other content uses EmDash Portable Text rendering.
- `src/utils/newsroom.ts`: route identifiers, entry type, Sofia date formatting and image URL fallback.
- `seed/seed.json`: Bulgarian content model and ten clearly marked demonstration articles. An existing database is not reconfigured by deploying a new seed. The native setup flow applied the seed to this initially unconfigured production instance. See the seed limitations below for a fresh installation.

Original English sample content is retained in the local CMS backup/current database. The old public post/page/tag templates no longer render an English edition or comments. `/posts` redirects to the news listing; old template entry URLs return the branded 404. Do not publish the original template About page as genuine company information.

## Content Model

One `articles` collection, routable at `/novini/{slug}`. Native supports: drafts, revisions, preview, scheduling, search and SEO. Comments are disabled. Slug, publication state, timestamps, revision history, bylines and SEO remain native entry capabilities.

| Field | Type | Required / purpose |
| --- | --- | --- |
| title | string | Required, searchable headline |
| excerpt | text | Required, searchable standfirst |
| content | portableText | Required, searchable body |
| featured_image | image | Optional native media object; permits text-only reporting |
| image_caption | string | Optional visible caption |
| image_credit | string | Optional visible rights/credit |
| source_name | string | Optional source attribution, separate from author |
| source_url | string | Optional HTTP(S) address; schema validation pattern because installed MCP does not expose a URL field type |
| featured | boolean | Editor-selected homepage lead; latest article is the fallback |
| breaking | boolean | Reserved editorial flag; no breaking-news automation |
| story_key | string | Optional non-translatable internal automation identifier |

The initial native byline is **Редакция PlovdivToday**. Templates support multiple future bylines and role labels without inventing author identities.

## Taxonomies

Native `category`: Пловдив (`plovdiv`), Трафик (`trafik`), Област Пловдив (`oblast-plovdiv`), Криминални (`kriminalni`), Бизнес (`biznes`), Култура (`kultura`), Спорт (`sport`), България (`bulgaria`), Уикенд (`uikend`).

Native hierarchical `location`:

- Пловдив (`plovdiv`): Централен (`tsentralen`), Тракия (`trakia`), Южен (`yuzhen`), Северен (`severen`), Западен (`zapaden`), Източен (`iztochen`).
- Област Пловдив (`oblast-plovdiv`): Асеновград (`asenovgrad`), Карлово (`karlovo`), Хисаря (`hisarya`), Раковски (`rakovski`).

Add neighbourhoods as children in the native taxonomy editor. No article schema change is needed. The location directory recursively renders descendants; parent landing queries include descendants. Empty locations show an honest empty state.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Editorial lead, four secondary stories, latest feed and eight section blocks |
| `/novini/` | Chronological articles and cursor pagination |
| `/novini/{slug}` | Article, native bylines/dates, hero/caption/credit, reading columns, source, related stories |
| `/plovdiv/`, `/trafik/`, `/oblast-plovdiv/` | Local, traffic and regional archives |
| `/biznes/`, `/kultura/`, `/sport/`, `/bulgaria/` | Section archives |
| `/kriminalni/` | Category archive, intentionally absent from initial primary navigation |
| `/uikend/` | Latest guide plus previous guides; articles in Уикенд, no events database |
| `/rayoni/` | Hierarchical location directory |
| `/rayoni/{slug}/` | Reusable location archive, including every term above |
| `/search` | Native full-text article search |
| `/rss.xml` | Existing feed adapted to articles |
| `/404` and unmatched paths | Branded 404 with actual HTTP 404 status |
| `/sitemap.xml`, `/sitemap-articles.xml`, `/robots.txt` | Native EmDash endpoints |

Footer reserves За нас, Контакти, Редакционни стандарти and Корекции as text until genuine information is supplied; there are no fabricated legal/contact pages.

## Design System

Overrides live in `src/styles/theme.css`; default `tokens.css` remains intact. Palette: #FFF0E3 main beige, #FEF6EF light beige, #F3DFCE dark beige, #201D1D ink, #262B33 dark accent, #3481AE Plovdiv blue. Supporting readable neutrals are used for rules and secondary text.

Inter uses Astro's downloaded/self-hosted font pipeline with explicit Latin, Cyrillic and Cyrillic Extended subsets. The system uses native spacing/weight tokens, a 1240px publication container, 720px reading column, image-ratio tokens, square geometry and minimal shadows. Breakpoints are documented beside the CSS: 1100px reading columns, 760px mobile navigation/grids, 480px compact phones. Desktop articles retain metadata/body/gutter columns. No essential information depends on colour.

Owner logos are not redesigned: wide logo for desktop, round mark for mobile/favicon. Supplied samples are copied to `public/brand` for bootstrap availability and uploaded to native media where available. Article fields are media objects rendered with `Image` from `emdash/ui`; dimensions, priority and below-fold lazy loading are explicit. Production authorizes its own host for Cloudflare image transformations.

Supplied asset inventory in `design-assets`:

| File | Dimensions | Intended use |
| --- | --- | --- |
| `wide-logo.png` | 2138 × 735 | Desktop masthead |
| `logo-round.png` | 595 × 595, transparent | Compact header/favicon |
| `logo-square.png` | 620 × 620 | Alternate square mark |
| `wide-logo-no-text.png` | 2172 × 724 | Alternate wide illustration |
| `plovdiv-wide-golden.png` | 2172 × 724 | Supplied city panorama demo image |
| `sample-images/man-shopping.jpg` | 780 × 520 | Business sample |
| `sample-images/trump-test.jpg` | 780 × 520 | Explicitly illustrative national-format sample |

## SEO

`getSeoMeta()` resolves per-entry document titles and SEO overrides. `Newsroom.astro` passes identity, canonical, descriptions, image, article timestamps and author to native `EmDashHead`. This supplies Open Graph, Twitter Card, canonical and publication metadata without parallel hand-written SEO tags.

`src/plugins/newsroom-seo.ts` is a small native `page:metadata` hook. It reuses `buildBlogPostingJsonLd`, changes the type to `NewsArticle`, treats the editorial byline as an Organization, and replaces the native `primary` graph by its existing ID. BreadcrumbList uses the visible trail. The native descriptor has an absolute build-resolved entrypoint; it does not require enabling the paid isolated Worker Loader. The native sitemap remains responsible for routable SEO-enabled published articles.

Production origin: `https://plovdivtodaysite.estudio-5ba.workers.dev`, configured in Astro `site`, Wrangler `EMDASH_SITE_URL` and finalized production settings. `.dev.vars` retains the local OAuth origin; do not replace local settings with a production canonical.

## Demo Content

Ten entries, all titles prefixed **ДЕМО:** and bodies explicitly explaining that they are layout demonstrations rather than real reporting:

- `demo-plovdiv-denyat`: lead, caption/credit/source and related articles.
- `demo-trafik-marshruti`: traffic and numbered list, no image.
- `demo-gradska-sreda`: longer reading layout, headings, list, quotation, links, bold/italic emphasis and native inline image/caption.
- `demo-kultura-programa`: culture.
- `demo-biznes-magazini`: shop photograph.
- `demo-sport-grad`: sport, no image.
- `demo-oblast-asenovgrad`: regional location.
- `demo-uikend-plovdiv`: Топ предложения, Петък, Събота, Неделя, С деца, Безплатни събития.
- `demo-bulgaria-kontekst`: national format and supplied test portrait, no fabricated claim about its subject.
- `demo-kratka-novina`: short format and reserved breaking flag.

Remove through the native Articles editor (trash is recoverable), or replace each with checked reporting. Remove obsolete stock-template posts/pages too before launch if no longer needed. Future deploys do not reapply sample content to a configured site.

## Prelaunch Mode

The single indexing switch is native **Settings → SEO → custom robots.txt**. Current value:

```text
User-agent: *
Disallow: /
```

The layout reads this setting and adds native `noindex, nofollow`, the visible demo banner. Native robots.txt still includes the sitemap reference. Sitemaps may list demos while crawlers are blocked; listing them is not a launch signal.

Before launch: replace/delete demo content, verify editorial/company information and imagery, confirm the public URL, then clear custom robots.txt or replace it with the intended normal rules. This automatically removes the global banner and page noindex metadata. Check the rendered HTML and robots.txt afterwards, and retain any individual entry's intentional SEO noindex setting. No code redeploy is needed for this switch.

## Deployment

Final deployed Worker version: `a6bfe26d-e3ba-41f9-896c-dc6f59ac178b`, verified 2 October 2026 (Europe/Sofia).

```bash
corepack pnpm typecheck
corepack pnpm build
corepack pnpm exec wrangler deploy --dry-run
corepack pnpm deploy
```

Use existing Wrangler authentication (`corepack pnpm exec wrangler login` if expired). The build preserves the existing Worker, D1 `DB`, R2 `MEDIA`, session KV, Cloudflare image processing and cron. Native admin/API schema changes take effect immediately; a code deploy is separate from schema evolution.

Local development: `corepack pnpm dev --host 0.0.0.0 --port 4321`. Run checks/builds sequentially with the dev server stopped: the installed Astro/Vite combination may invalidate optimized dev dependencies when a concurrent build/check runs. Restart development afterwards. Generated `emdash-env.d.ts` comes from the native typegen endpoint and should reflect the live model.

Local pre-change SQLite backup and production Time Travel bookmark are in ignored `.local-backups`. D1 SQL export cannot handle the current FTS5 virtual tables. Do not restore the bookmark after new owner/content changes without reviewing them.

## Verification

Completed on 2 October 2026 against the actual production instance, with CLI and browser authentication supplied by the owner.

| Requirement | Acceptance evidence |
| --- | --- |
| CMS model and lifecycle | Native production schema read confirms eleven article fields, drafts, revisions, preview, scheduling, search and SEO; comments off; `/novini/{slug}` routable |
| Taxonomies and byline | Native reads confirm nine Bulgarian categories, twelve hierarchical location terms, and the Bulgarian Редакция PlovdivToday byline; all ten demos assigned |
| Editorial workflow | Real production admin: create headline/excerpt/body, select media/category/location/byline, add caption/credit, save draft, preview, publish, edit, republish and inspect four revision versions |
| Draft isolation | Anonymous draft URL returned 404; editing a published headline preserved the live headline until Publish changes |
| Test cleanup | `demo-proverka-redaktor` moved to recoverable Trash; public URL 404; original ten published demos retained |
| Public routes | 45 HTTP checks: intended routes/search/feed/robots/sitemaps 200, four missing/trashed URLs 404; HTML pages each have one H1, `lang="bg"`, noindex and no undefined/null/Invalid Date placeholders |
| Article rendering | All ten article pages have exactly one NewsArticle; long sample renders paragraphs, five H2s, list, blockquote, links, bold/italic and a native inline image with caption; hero caption/credit, byline, dates, source and related stories inspected |
| Responsive | Homepage and image-bearing long article checked at 375, 430, 768, 1024 and 1440px: no horizontal overflow. Desktop body 720px; mobile/tablet adapts. Mobile footer/weekend landing and empty Източен archive inspected |
| Navigation/accessibility | Native mobile disclosure opens with Enter; Tab reaches its links; 3px focus outline visible. TOC link resolves to the correct heading. Meaningful text links, decorative brand alt handling and semantic landmarks checked |
| Contrast | Ink/body 15.65:1, secondary/body 9.01:1, muted/beige 6.05:1, prelaunch white/dark 14.23:1. Blue focus outline 4.01:1; blue is not the normal small-text colour |
| Media | Five supplied assets uploaded to native media/R2; logos, hero and native body image loaded in production browser. Seven image-bearing demos, three intentional text-only demos |
| SEO | Rendered lead: unique title/description/canonical, OG title/description/native media URL, Twitter large-image card, ISO publication/update dates, article:author, NewsArticle Organization author/publisher and BreadcrumbList |
| Prelaunch | Native robots returns Disallow: / and sitemap reference; global HTML noindex/nofollow protects the demo publication |
| Engineering | Seed validation pass; final Astro check: 30 files, zero errors/warnings/hints; production build/deployment pass; existing Cloudflare bindings/cron preserved, no new dependency |
| Logs | No warning/error console entries in the reviewed production pages; local dev logs show normal startup, OAuth refresh and type generation |

Production screenshot: `docs/verification/production-homepage.jpg`. Sanitized route evidence: `docs/verification/http-checks.json`. These checks are foundation acceptance checks, not a formal WCAG certification or measured Core Web Vitals audit.

### Native seed limitations

The installed EmDash seed importer did not download the self-origin bootstrap images, and its initial byline creation did not persist the Bulgarian locale. Actual production was repaired using native media upload, Bulgarian byline translation, article byline/media assignments, navigation and settings APIs. No vendor code was changed. A fresh installation must verify these items after seed application; the seed alone is not a verified one-command clone of the finalized instance.

For a fresh setup: apply the schema/content seed, upload the five chosen files from `design-assets` through native Media, select the desktop logo/round favicon/default social image in Settings, assign the images and Bulgarian editorial byline to articles, and check native menu order and SEO robots settings. Native admin and CLI remain the authoritative editing tools.

The production build's large-chunk notice comes from the bundled EmDash admin/editor, not a new public framework bundle. No lint/test scripts are configured. Demo removal, genuine newsroom/company details and enabling indexing are deliberate launch tasks; they are not fabricated in this foundation.

## Future Integration Points

- n8n: authenticated native content/media API or MCP; `story_key` is an optional stable external key.
- Image resolver: upload media through native API, populate `featured_image` plus truthful credit/caption.
- Automatic publication: create a draft and use native publish/schedule/revisions after an explicit editorial policy is established.
- Weekend automation: ordinary articles assigned to Уикенд; existing guide body and landing presentation remain the integration point.
- Social automation: consume publication metadata through native content hooks/API. Nothing sends to social platforms in this milestone.

Next milestone: replace demonstrations with verified local reporting, supply genuine newsroom/contact/standards/corrections information, and run a launch-readiness review before enabling indexing.
