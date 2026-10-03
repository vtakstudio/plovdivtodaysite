# PlovdivToday Source Registry v1

Technical HTTP inspection: **3 October 2026, Europe/Sofia**. All six sources inspected without browser automation. Source endpoints and article extraction were exercised from this workspace; remote n8n execution was subsequently verified in the acceptance run described below. HTTP 200 alone is not treated as adapter verification: actual item title/date/link and selected primary text were parsed.

| ID | Name | Role | Exact ingestion endpoint | Method |
|---|---|---|---|---|
| `plovdiv_municipality` | Община Пловдив | `primary_official` | https://www.plovdiv.bg/feed/ | Broad WordPress RSS |
| `odmvr_plovdiv` | ОДМВР-Пловдив | `primary_official` | https://www.mvr.bg/plovdiv/информационен-център/пресцентър/новини | Structured HTML index |
| `bta_plovdiv` | БТА — Пловдив | `primary_editorial` | https://www.bta.bg/bg/news/bulgaria/regional-news/oblast-plovdiv | Structured regional HTML index |
| `plovdiv_regional_admin` | Областна администрация Пловдив | `primary_official` | https://pd.government.bg/?feed=rss2&cat=3 | News-category RSS |
| `plovdiv24` | Plovdiv24 | `discovery` | https://www.plovdiv24.bg/rss.php?cat=1 and https://www.plovdiv24.bg/rss.php?cat=2 | Official city + region RSS |
| `podtepeto` | Под тепето | `discovery` | https://podtepeto.com/feed/ | WordPress RSS |

The runtime encodes Cyrillic MVR paths. Plovdiv24's unfiltered feed responds too; city (`cat=1`) and region (`cat=2`) were compared and contain the corresponding distinct items. The regional administration advertises RSS and its news category feed is functional, so RSS is simpler than HTML ingestion here. `/feed/` on Под тепето returns stable RSS; its full `content:encoded` is deliberately ignored.

## Extraction and selected-story policy

**RSS sources:** `item/title`, `item/link`, `item/description`, `item/pubDate`. CDATA and common HTML entities are decoded, tags removed, excerpts bounded at 2,200 characters. Invalid or missing dates reject that item, not the entire feed. Publication dates use the feed's stated offset and become UTC ISO timestamps. No inferred publication date from detection time.

**Municipality:** full text only after selection, paragraphs/list items/headings inside `.post-content`. Remove scripts, navigation, footers, asides and view counters. Example successfully inspected: `https://www.plovdiv.bg/zapochva-esennata-deratizatsiya-v-plovdiv/`.

**ОДМВР:** cards `.card`, title/link from `.card__title`, Bulgarian date from `.card__meta` such as `2 Октомври 2026`. Dates without a clock conservatively use midnight in Europe/Sofia. Index has no reliable excerpt, so it supplies title/date/URL and selected context uses `.page-content`. Inspected article ID `93323` on the configured news path. A normal Mozilla-compatible User-Agent is required by the observed HTTP behavior. This is the official news index; the separate informational-bulletin category is not additionally ingested in v1.

**BTA:** only `.post-list` regional cards, then `.news-card__title a` and `.news-card__meta` (`DD.MM.YYYY HH:mm`, Europe/Sofia). Do not read global navigation's embedded news cards; they contain unrelated national/world content. The regional cards have no excerpt. A selected article must have BTA author attribution in `.post__author` and exactly BTA in `.post__sources`; Reuters/AP/AFP/Ройтерс/Асошиейтед прес/Франс прес attribution is rejected. Full editorial text comes from `.post__content`. A failed provenance check fails that story; its unverified BTA excerpt is not passed as fallback. Inspected BTA-original regional article `1216933` (Камелия Тодорова). Writing must retain BTA attribution. Only the selected main BTA page is used; other unverified BTA title-only items are omitted from context.

**Regional administration:** `?feed=rss2&cat=3`, title/link/date/description as RSS above. Selected full page uses `.entry-content`. Inspected article `?p=44250`. Query parameter `p` is essential identity and is retained during URL normalization.

**Plovdiv24:** title/excerpt/URL/date exposed by the two RSS feeds only. Never automatically fetch its article pages. The RSS excerpt can be too short to support a standalone story; Writer may refuse. City and region items share one source ID and one exact-URL dedupe table.

**Под тепето:** title/excerpt/URL/date from RSS description only. Remove the appended “Материалът … е публикуван за пръв път …” feed footer. Do not read `content:encoded` or fetch full articles. Some excerpts are short; refusal is expected rather than invented context.

## Observed ingestion

Using downloaded live responses and the shared deterministic adapter, the initial 36-hour window contained 10 municipal, 1 police, 16 BTA regional, 2 regional-administration, 30 Plovdiv24 city, 7 Plovdiv24 region and 10 Под тепето candidates. These are observations, not per-source publishing quotas. The subsequent production n8n acceptance execution `402149` ingested 71 candidates: 8 municipality, 16 BTA, 1 regional administration, 36 Plovdiv24 (both feeds combined), and 10 Под тепето. The police index returned HTTP 403 from the n8n host, despite a normal Mozilla User-Agent, and contributed no candidates. It remains configured for independent polling; other sources continue. Ten real articles were generated and published, including municipal service, regional, culture and discovery-only stories. The latest equally authoritative primary report is used for writing context so a grouped incident resolution is not discarded; story identity remains tied to the deterministic primary URL.

## Shared rules

HTTP(S) only, no URL userinfo, same host as configured source; malformed URL/title/date rejected. Strip fragments, `utm_*`, `fbclid`, `gclid`, `yclid`, `mc_cid`, `mc_eid`; sort remaining query parameters, retain identity parameters. Publication window: 36 hours, with at most one hour future skew. Candidate ID = first 16 hex characters of SHA-256 of canonical URL. Feed/index polling occurs every 15 minutes only after successful live acceptance tests and activation.
