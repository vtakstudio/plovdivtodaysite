# PlovdivToday editorial design — 2 October 2026

The homepage uses an editorial front-page layout: a lead headline beside imagery on desktop, supporting news columns, a chronological latest-news stream, numbered category sections, a spacious Weekend feature and a charcoal footer. Mobile puts the headline before edge-to-edge lead imagery.

Sofia Sans serves the interface and article body; bold Alumni Sans SC serves headings and category numbers. Both use Astro’s self-hosted font pipeline with Cyrillic support. The main surface is the owner’s #FFF0E3 cream, with #F3DFCE for Weekend, #201D1D ink, Plovdiv blue links and restrained terracotta numbering.

The shared header uses the owner’s transparent logo v2, centered and scaled up to 720px. Equal side columns reserve space for the weather icon with an unavailable-temperature placeholder (—°), and an accessible search icon linking to the native search page. Centered categories prioritize Пловдив, Бизнес and Култура. Actual label widths determine which sections fit; remaining sections appear in the native “Още” disclosure. Without JavaScript, the three priority sections and More remain available.

Numbered category headings link to their archives alongside “Виж всички”. The decorative hill divider, homepage intro/date strip and demo banner have been removed. Native CMS content, menus, schema and SEO/prelaunch settings remain in place.

Article pages use a quiet headline and standfirst, a byline before the 16:9 image, and a 720px reading column. Metadata and contents gutters are subdued on desktop and collapse on smaller screens. Breadcrumb links follow the current host, including the LAN preview.

## Verification

- Final Astro check: 30 files, zero errors, warnings or hints.
- Production build passed.
- Responsive homepage and article checks completed during the design work. Final header checked at 320, 375, 768px and the normal desktop viewport without overlap or page overflow.
- Category fitting, More disclosure and keyboard toggle, category-heading navigation, search navigation and article typography verified in-browser.
- Final design screenshots: [desktop](verification/design-pass-09-logo-v2-desktop.jpg), [mobile](verification/design-pass-09-logo-v2-mobile.jpg).

The local database predates production content repairs, so demonstration copy and timestamps can differ between environments. This release changes the presentation, not the CMS content.
