# PlovdivToday Frontend v1 — final review

This is the bounded refinement pass before ingestion automation. The existing Astro/EmDash architecture, schema, native publishing, SEO and prelaunch noindex switch remain in use.

## Publication design

- Sofia Sans for reading/interface; Alumni Sans SC 700 for display headlines.
- Cream #FFF0E3 is the publication surface; ink carries headlines and navigation.
- Blue carries interaction and latest-news emphasis. Terracotta carries editorial numbering and demo notices.
- Desktop logo width reduced from 720px to 600px. Mobile keeps the transparent v2 logo and measured category overflow.
- Lead uses approximately 44% text / 56% image, a 52px maximum heading, and a text-only fallback.
- Latest news has a short strip below navigation plus an eight-item stream immediately after the lead.
- Sections use three templates: feature (one primary + two secondary), standard (up to three equal columns), feed (up to eight compact rows). A single ordinary story uses the feed; two standard stories fill two columns. Feature secondary stories stay grouped at the top rather than stretching to the primary image height.
- Weekend is a warmer editorial surface, with guide imagery, weekend dates based on the guide publication date, and working search links for children, free activities and evening ideas. An illustrated guide can be selected from the category even when newer text-only stories exist. Explicit event-date fields and curated audience filters are future editorial decisions.

## Article reading

Calmer 62px maximum headline, standfirst, author/publication/update metadata, 1000px-wide hero, credit/caption, and 720px reading column. Mobile body text remains 19px Sofia Sans. H2/H3, bullet/numbered lists, quotations, links, source and related stories use native Portable Text and CMS fields. Portrait hero images are contained at their original ratio with a 660px height cap; ordinary heroes use a 16:9 display crop. No-image articles omit the figure completely.

## Demo content and imagery

Twenty explicitly fictional materials test realistic Bulgarian headlines. The main example exercises H2, H3, lists, a clearly fictional quotation, links and source information. Demo detection uses the existing `story_key` beginning with `demo-`; headline prefixes are replaced by visible demo labels and an article notice. Other content is unaffected.

The seed records the fixtures for fresh installations. Existing local/production entries are updated through native content APIs with revision checks; deployment does not reseed existing databases. Content history remains available. Pre-update snapshots are kept locally in `/tmp/pt-before-*.json` and are not committed.

Original archival photography is stored under `public/brand/demo/` and uploaded to the native media library. Attribution/source/license links are in [credits.txt](../public/brand/demo/credits.txt). No downloaded photograph is presented as documentation of a fictional event.

Image cases: pedestrian.jpg (3264×1836, 16:9/detailed), street.jpg (1920×2560, portrait), fountain.jpg (4592×3448, approximately 4:3/dark), night.jpg (1280×835, dark), and entries without a featured image. Existing owner-supplied illustration/shopping image remain in the fixture mix.

## Verification

- Astro typecheck: 30 files, zero errors/warnings/hints.
- Production build: successful.
- Browser review: desktop 1440px, mobile 390px; long headline wraps, latest-news treatment, three section templates, portrait containment, dark photograph and imageless article checked.
- The desktop lead example wraps to four lines; image column is about 56% of available grid width.
- Production article desktop/mobile screenshots are provided after the automatic main-branch deployment.

Frontend v1 is ready for final visual review. Further design exploration and n8n are outside this pass. Weather remains an unavailable-value placeholder. The next milestone is Source Registry → ingestion → deduplication → generation → publishing → image strategy.

## Local review correction (not deployed)

Following Val’s review, return the lead to approximately 48% text / 52% image and compact section thumbnails to a 2:1 display crop. Cap article imagery at 840px wide and portrait imagery at 540px high. Use one 1px divider token throughout; reverse its ink/cream contrast only in the dark footer. These corrections are local pending approval. Every future deployment, including any push to main, requires Val’s explicit release approval.
