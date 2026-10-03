# PlovdivToday Automation Foundation

**Status: accepted after manual production n8n lifecycle tests on 2 October 2026. Both workflows remain inactive and unscheduled. No push or deployment.**

## Operational update — 3 October 2026

The original acceptance state below describes 2 October. During the authorized News Pipeline v1 setup, n8n required published sub-workflow dependencies, so Publisher `Wl3I8fbJ7VkACeH3` was published. Its nodes, connections and runtime settings were not changed. It still has no autonomous schedule/webhook. The original manual harness remains inactive. See `docs/news-pipeline-v1.md` for current pipeline state.

## Inspection before implementation — 2 October 2026

Production: https://plovdivtodaysite.estudio-5ba.workers.dev/. Repository HEAD `94d8988`. Frontend v1 is unchanged. Production MCP was queried directly through its authenticated endpoint (the configured site MCP points to localhost). The actual production OpenAPI was fetched with authentication and inspected, including request/response schemas. Its declared API version is `0.1.0`; installed repository EmDash is `1.0.1`.

Collection `articles`, ID `01M3W74PFBW968FW7EKME94RYS`, URL `/novini/{slug}`, supports drafts, revisions, preview, scheduling, search, seo. SEO enabled, comments off, edit locking on.

| Field | Type | Required | Indexed | Unique | Translatable |
|---|---|---|---|---|---|
| title | string | true | false | false | true |
| excerpt | text | true | false | false | true |
| content | portableText | true | false | false | true |
| featured_image | image | false | false | false | true |
| image_caption | string | false | false | false | true |
| image_credit | string | false | false | false | true |
| source_name | string | false | false | false | true |
| source_url | string | false | false | false | true |
| featured | boolean | false | false | false | true |
| breaking | boolean | false | false | false | true |
| story_key | string | false | false | false | false |

The table above records the initial schema. `source_url` additionally validates `^https?://`. Inspection found 20 active published demo articles and one older trashed test. All 20 non-null story keys are distinct; the old trashed test has no story key. The database-level duplicate audit preceded the non-destructive unique-index migration described below.

Existing BG byline: **Редакция PlovdivToday**, ID `01M3WACKKYR8PKDR9XAX91FF4W`, slug `redaktsia-plovdivtoday`. Its translation-group ID `01M3W74Z4TFJ6R1A9DACASMC2X` is a different record; do not confuse these IDs.

### Taxonomy `category` (BG)

| Slug | Label | ID | Parent ID |
|---|---|---|---|
| plovdiv | Пловдив | `01M3W74SK4T1K1SSQ3G95KFY0V` | — |
| trafik | Трафик | `01M3W74SX81EC59GATDGEEAW54` | — |
| oblast-plovdiv | Област Пловдив | `01M3W74T2QPHMAWRVSRVSFDXZB` | — |
| kriminalni | Криминални | `01M3W74T84YJM9FB2QVAX1ZHXQ` | — |
| biznes | Бизнес | `01M3W74TD2T8TFMY76HXZQ9KG1` | — |
| kultura | Култура | `01M3W74TJJQGNR6Z0W6X1F2JW0` | — |
| sport | Спорт | `01M3W74TQQPX5P397QQV4B6QQE` | — |
| bulgaria | България | `01M3W74TWYV82092VNF25T06Q6` | — |
| uikend | Уикенд | `01M3W74V2BMQR05AGPF6ZB7X7D` | — |

### Taxonomy `location` (BG)

| Slug | Label | ID | Parent ID |
|---|---|---|---|
| asenovgrad | Асеновград | `01M3W74XGK0X6JRSX79WQWBG5D` | 01M3W74VQFBZPD353HA80DZP0A |
| plovdiv | Пловдив | `01M3W74VHRK2ZZ2G9J8PHDXJR2` | — |
| tsentralen | Централен | `01M3W74VWQTABMDQS9BVS5RB5M` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |
| karlovo | Карлово | `01M3W74XS9QSTZ4SJ72E59ZNP4` | 01M3W74VQFBZPD353HA80DZP0A |
| oblast-plovdiv | Област Пловдив | `01M3W74VQFBZPD353HA80DZP0A` | — |
| trakia | Тракия | `01M3W74W58DK29X5VKT5RDTCFT` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |
| hisarya | Хисаря | `01M3W74Y27BKN4PZQ4AVBJCE7H` | 01M3W74VQFBZPD353HA80DZP0A |
| yuzhen | Южен | `01M3W74WDBGC374P8Q98NZNHPE` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |
| rakovski | Раковски | `01M3W74YTTQNQWSM7WR2ASTQ7M` | 01M3W74VQFBZPD353HA80DZP0A |
| severen | Северен | `01M3W74WNDVX6C6QAESAYX5W3V` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |
| zapaden | Западен | `01M3W74WXX0ZF1D972ZRD4A7HJ` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |
| iztochen | Източен | `01M3W74X62G72ZAR09CNA9GPYF` | 01M3W74VHRK2ZZ2G9J8PHDXJR2 |

## Authoritative REST findings

- Every response uses `{success,data}` or `{success:false,error}` except the OpenAPI document itself. Content responses are `data.item` plus `data._rev`, not an `_rev` on the item.
- `listContent` accepts JSON-encoded `fieldFilters`, `status=all`, `limit` (max 100), cursor, and locale. Exact scalar equality on indexed fields is supported. Chosen lookup: `fieldFilters={"story_key":"..."}`, `status=all`, `limit=2`. No Data Table is needed.
- Create: `POST /_emdash/api/content/articles`, root `{data,status:"draft",locale:"bg",bylines:[{bylineId:...}]}`. Only draft status is accepted. Bylines are root metadata, not collection fields.
- Update: `PUT /_emdash/api/content/articles/{id}`, partial root `{data,_rev}`. Omit status on published updates so EmDash stages a draft and retains the live revision. Root `taxonomies` is also supported, but the publisher uses the requested explicit terms endpoints.
- Publish: `POST /_emdash/api/content/articles/{id}/publish`, `{_rev}`. Read immediately before publishing. No automatic overrideLock.
- Terms: `GET` / `POST /_emdash/api/content/articles/{id}/terms/{taxonomy}`. POST replaces just the named taxonomy using `{termIds:[...]}`; this endpoint has no revision-token parameter.
- Taxonomy lookup: `GET /_emdash/api/taxonomies/{name}/terms?locale=bg&includeCounts=false`, returns `data.terms`, recursively nested for hierarchical taxonomies. Resolve existing slugs; never create terms.
- Schema update accepts unique/indexed booleans in OpenAPI, but production **rejects changing unique** with `FIELD_UPDATE_REQUIRES_MIGRATION`. Indexing can be enabled in place. A physical unique index is required for existing content; deleting/recreating the field is unacceptable. This difference must be recorded separately from the logical field flag.

## n8n inspection

Connected instance: https://auto.tipsterplus.com/. Data Tables and public API workflow/credential creation are available. No existing PT publisher, PT mapping table, or EmDash credential was found. The n8n-MCP package version 2.91.0 is **not** the installed n8n server version. Authenticated Settings → Usage and plan confirms installed **n8n 2.20.6**, Community Edition Registered. Public unauthenticated settings hide this version.

Available node metadata: HTTP Request latest 4.5; Execute Workflow Trigger 1.2 supports `inputSource:passthrough`. Generic `httpBearerAuth` credential has a token field. HTTP Request can return full status/body and preserve non-2xx responses (`neverError`). Workflow creation defaults inactive. Automatic HTTP-node retries must stay disabled; concurrency retries belong to explicit application logic.

Official n8n MCP execution access is absent. Use the signed-in editor for manual executions; do not activate a webhook or schedule to work around this. No unrelated workflows are modified.

## Implementation and operations

Publisher: **PT — EmDash Article Publisher v1**, ID `Wl3I8fbJ7VkACeH3`, https://auto.tipsterplus.com/workflow/Wl3I8fbJ7VkACeH3. Inactive, no schedule, no HTTP trigger, no ingestion nodes. Manual harness: **PT — Publisher manual smoke test**, ID `yyMNBdV5qGcGGvTC`, also inactive; its only trigger is Manual Trigger. Both validate with zero errors/warnings and were manually executed in the signed-in editor using the dedicated runtime credential.

### Article Payload v1

The executable validation lives in `automation/n8n/publisher-machine.mjs`. The documented schema is `automation/article-payload-v1.schema.json`. Complete no-image fixture: `automation/fixtures/article-v1.json`, including paragraph, H2, unordered list, and an annotated link. No Markdown or AI conversion exists.

```json
{
  "story_key": "required-stable-external-id",
  "title": "Article title",
  "excerpt": "Short standfirst",
  "content": [{"_type":"block","_key":"p","style":"normal","markDefs":[],"children":[{"_type":"span","_key":"s","text":"Article paragraph","marks":[]}]}],
  "category": "plovdiv",
  "locations": ["tsentralen"],
  "source_name": "Optional source",
  "source_url": "https://example.com/source",
  "featured": false,
  "breaking": false,
  "featured_image": null,
  "publish_mode": "draft"
}
```

One JSON item per call. `story_key`, `title`, and valid nonempty `content` are required on every call. New stories additionally require nonempty `excerpt` and an existing `category`. `publish_mode` defaults to `draft`, accepts only `draft`/`publish`. `story_key` is case-sensitive, at most 200 characters, no surrounding whitespace. Unknown fields are rejected. Optional fields omitted from updates are retained; `locations: []` explicitly clears locations. `null` clears optional source/image values. Text v1 accepts native span blocks, normal/heading/blockquote styles, bullet/number lists, standard decorators, and link annotations; custom embedded blocks are intentionally unsupported. Link marks and block/span keys are checked. Existing media references require at least `id` and `provider` and are passed unchanged; no media upload/read permission is requested.

### Story key protection

Pre-migration physical audit included **all 21 rows**, including Trash: 20 non-null keys, no duplicates. Schema API enabled `indexed:true`; exact lookup was verified against an existing key and a missing key. Native scalar equality works with JSON-encoded `fieldFilters` and `status=all`. `limit=2` plus `total` detects ambiguity and fails rather than choosing arbitrarily. No fuzzy search or n8n Data Table is used.

Existing-field `unique:true` was refused by production with HTTP 400 `FIELD_UPDATE_REQUIRES_MIGRATION`. We did not drop/recreate the field, overwrite its metadata, or change content. Native D1 SQL applied the non-destructive unique-index migration in `automation/migrations/story-key-unique.sql`. `PRAGMA index_list(ec_articles)` confirms `pt_articles_story_key_unique` has `unique=1`. The logical EmDash field still reports `unique:false`; physical DB protection is true. `required:false` and `translatable:false` remain unchanged. SQLite allows multiple NULLs. Keys remain reserved while entries are in Trash; restore the original rather than creating a replacement. Global uniqueness means future locale translations cannot share a key; this publisher is deliberately BG-only.

A D1 recovery bookmark was obtained before the unique index: `00000038-00000030-000050f8-8d2bf50bd012c0f49393eb70b48991cf`. The seed declares unique/indexed true for fresh databases; changing a seed does not migrate existing installations. A fresh environment gets a native UNIQUE field; an existing environment needs the audited index migration. Do not reapply the whole seed to production.

### Authentication

Dedicated n8n `httpBearerAuth` credential **PT — EmDash Publisher v1**, ID `FqfbTb59cQLSZRp9`. Dedicated EmDash PAT ID `01M3YBP3QG82NNZFC1J8XXTADT`, scopes **`content:read`, `content:write`**. No admin/schema/media scopes. This EmDash release has no separate PAT publish scope: publish is covered by content write plus the owner's RBAC permission. Its `content:write` scope also grants taxonomy/menu management for backward compatibility; the workflow itself only assigns existing terms.

The PAT belongs to the existing administrator because native token creation is owner-bound and no separate automation account exists. It is a dedicated restricted token, not reuse of the broad CLI OAuth token. A separate Editor automation identity can replace it later if the owner sets up that account. PAT has no expiration; revoke/rotate through the owner's API Token settings and replace the n8n credential value. No raw credential was written to disk, code, workflow exports, docs, or console. It was created and transferred directly between authenticated API clients in memory. Runtime networking occurs exclusively in the HTTP Request node with its credential reference.

### Create lifecycle

Validate → resolve BG category/location slugs to existing IDs → exact story-key lookup → create **draft** with collection data and existing BG byline → read editor lock before each explicit category/location assignment → replace named taxonomy using native `{termIds}` endpoints → GET final draft and verify its revision still equals the create revision → stop or explicitly publish. Create never supplies published status. If a create loses a uniqueness race, the workflow performs one read-only exact lookup; an existing key returns `STORY_KEY_CONFLICT` with its ID, never a second create or silent overwrite.

### Update lifecycle

Exact lookup → GET current entry and `_rev` → check any editor lock → partial PUT using `_rev` → GET final draft and verify it is still our revision → stop or publish. Slug, author/byline, omitted CMS fields, omitted taxonomies, publication time and unrelated metadata are retained. Root `taxonomies` on the PUT applies supplied assignments with the content write and revision check; only named taxonomies change. This supported update mechanism avoids unprotected separate taxonomy writes on existing articles.

Do not send `status:"draft"` on an already published item and do not call unpublish. EmDash's normal partial PUT stages a draft while its live revision remains public. Adapter result `status:"draft"` denotes saved draft mode; the underlying CMS may still report `status:"published"` with `draftRevisionId` set. `public_url` points to the existing public version in that case.

### Publish lifecycle and concurrency

Read back → retain newest `_rev` → verify no writer changed it after our save → check editor lock → POST publish `{_rev}` → GET to confirm published status and cleared pending draft. Existing ID, slug/URL and publishedAt stay unchanged; updatedAt/dateModified advance. We never backdate, skip revisions, discard a human draft, or pass `overrideLock`.

On stale update/publish `CONFLICT`, one GET and **at most one retry for the entire run** are allowed. Retry is safe only when the substantive content/bylines/status/schedule/live revision equal the previously observed snapshot. Otherwise return conflict. Publish compares against the final draft snapshot, not merely a fresh token; it will not publish intervening human edits. Every run has a 24-request guard and 180-second workflow timeout. HTTP-node generic retries are disabled, timeout is 30 seconds, redirects disabled. Unexpected network/invalid-envelope responses return sanitized `TRANSPORT_ERROR`; the later caller can retry.

Any nonempty edit-lock holder stops the publisher with `ENTRY_LOCKED`, even when the editor is using the PAT owner's account (`heldByCaller:true`). Native update/publish also enforce other-user locks. The create-only term-assignment endpoints have no `_rev` or atomic lock-precondition parameter; the publisher checks the lock before each assignment, but the REST contract cannot eliminate a lock-acquisition race between check and assignment. Category/location assignments are native non-versioned metadata, so their changes can become visible before a text draft is republished.

### Results and errors

Success: `{success:true,action:"created"|"updated",story_key,emdash_id,slug,status:"draft"|"published",public_url:null|url}`.

Failure: `{success:false,story_key,emdash_id?,code,message,retryable}`. Validation errors do not write. Native stable codes are retained, including `ENTRY_LOCKED`, `CONFLICT`, forbidden/auth errors. `STORY_KEY_CONFLICT` identifies a verified active key after a failed create; `DUPLICATE_STORY_KEY` signals lookup ambiguity. Retryable means a later caller may retry; it does not schedule anything. A structured failure is a completed n8n execution, so callers must inspect `success`, not only n8n's execution status.

On this production D1 adapter, the unique constraint rejects duplicate create but the handler returns HTTP 500 `CONTENT_CREATE_ERROR`, rather than the expected HTTP 409 `CONFLICT`. The recovery lookup handles an active concurrent entry. If the reservation exists only in Trash, lookup returns no active match: preserve the native error and explain that the key may be reserved in Trash. No create retry is attempted.

### Calling from another workflow

Use **Execute Sub-workflow**, choose workflow `Wl3I8fbJ7VkACeH3`, run once **per item**, and wait for completion. Pass the Article Payload v1 JSON directly (passthrough input), then branch on returned `success`. No credentials need to be passed by callers. Do not pass batches into one sub-workflow invocation. Keep this publisher inactive; Execute Sub-workflow works without activation. The included manual harness demonstrates this boundary and is unscheduled.

The exported HTTP Request uses compatible node version 4.2, Code v2, IF v2.2, Execute Workflow Trigger v1.1. MCP's node catalog reports newer available metadata (HTTP v4.5, trigger v1.2); installed n8n 2.20.6 successfully executed these exported versions. The HTTP Request `sendBody` toggle must be static `true`; this server rejected an expression there with `INVALID_JSON`. GET requests consequently send `{}`, accepted by this production API. Rebuild the embedded Code node from source with `node automation/n8n/build-workflow.mjs`, then update the inactive n8n workflow explicitly; editing a source file alone does not update n8n. Credential references in exports are instance-specific: rebind the dedicated credential on another instance.

### Deliberately unimplemented

No RSS/source registry/ingestion, source dedupe, scraping, LLM/AI conversion/writing, media discovery/upload, image licensing, social publishing, schedules, real news, Weekend integration, or automatic publication policy. No frontend styling or architecture changes. No Git push or code deployment was performed.

## Verification results and acceptance

Actual manual n8n tests used the dedicated Bearer credential and called the publisher as a sub-workflow. Credential-free results and child execution IDs are in `docs/verification/automation-n8n-smoke.json`.

| Harness execution | Result |
|---|---|
| 399936 | Created no-image fixture A draft, ID `01M3YYZKYF53Z08MM1V8XJJSA4` |
| 399940 | Exact same payload updated that ID; no duplicate |
| 399944 | Changed title/excerpt/body and explicitly published |
| 399949 | Saved changed published article as draft; old body remained public |
| 399953 | Republished same ID/slug; publishedAt preserved, updatedAt advanced, new body public |
| 399957 | Created fixture B draft with category `trafik` and location `trakia` |
| 399961 | Returned structured `ENTRY_LOCKED`; revision unchanged, no override |

Fixture A uses `automation-smoke-plovdiv-001`, category `plovdiv`, location `tsentralen`, and the existing BG editorial byline. Public HTML returned 200 and contained the title, body, byline, category, location and NewsArticle data. Its Portable Text fixture includes paragraph, H2, unordered list and link. Child execution `399954` records protected PUT and publish POST requests with distinct `_rev` tokens; the final token was read after saving.

Native production REST tests used the same source state machine through the setup OAuth client, separately from n8n. Evidence in `docs/verification/automation-rest-smoke.json` covers existing-media pass-through/null, malformed/stale revision conflicts, one safe retry for unchanged update/publish state, intervening substantive edit refusal, and duplicate constraint rejection. These native conflict races were not artificially injected into an n8n execution. Eleven focused source tests additionally cover invalid payload/taxonomy, duplicate ambiguity, retry exhaustion and sanitized transport errors.

Final verification: both remote workflows validate with **zero errors and warnings**; nodes, connections and settings match the local credential-reference-only exports. Both remain **inactive**, with no schedule or webhook. Publisher `saveDataSuccessExecution` was temporarily `all` to inspect child requests and restored to `none`; the manual harness retains its original manual-execution history settings. Its fixture code was restored to the base draft export.

`corepack pnpm typecheck`: zero errors/warnings/hints. `corepack pnpm build`: passed with the existing >500 kB bundle-size warning. All 11 state-machine tests pass. Frontend source/templates/styles/config were not changed.

### Cleanup and repeating tests

Both new n8n fixtures are in recoverable production Trash:
- `automation-smoke-plovdiv-001`: `01M3YYZKYF53Z08MM1V8XJJSA4`
- `automation-smoke-trafik-n8n-001`: `01M3YZ8WHDE1HDPH0MQSFY1FQC`

The earlier REST fixture `automation-smoke-trafik-001`, ID `01M3YBYF8DSAPMHQZFAPVTFFR1`, also remains in Trash. Final production read confirms **20 original active articles**, no active smoke keys and HTTP **404** for fixture A's former public URL. No permanent deletion occurred.

Trash reserves both story keys and generated slugs. Before repeating the base harness, restore fixture A through EmDash's normal recovery UI; it will take the UPDATE path. For a fresh CREATE test, deliberately choose a new test key and a distinct title/slug, then Trash it afterward. Running the base harness against its trashed reservation will fail cleanly rather than recreate it.

Manual execution uses the signed-in n8n editor's Execute workflow control. Management MCP supports inspection, updates and validation but its test tool returns `NOT_CONFIGURED` because the separate Instance-level MCP service is disabled. This service and Available in MCP exposure were not enabled; neither is needed for normal sub-workflow use.

## Deliverables

- `docs/automation-foundation.md` — inspected contracts, implementation, operational instructions, test status.
- `automation/article-payload-v1.schema.json` — small v1 input schema.
- `automation/fixtures/article-v1.json` — no-image Portable Text smoke fixture.
- `automation/n8n/pt-emdash-article-publisher-v1.json` — reusable credential-reference-only publisher export.
- `automation/n8n/pt-publisher-manual-smoke-test.json` — inactive manual caller export.
- `automation/n8n/publisher-machine.mjs` / `.test.mjs` — pure transitions and focused concurrency/validation tests.
- `automation/n8n/build-workflow.mjs` — embeds tested transition source in export.
- `automation/n8n/emdash-rest-contract.json` — credential-free subset of actual production OpenAPI with referenced schemas.
- `automation/migrations/story-key-unique.sql` — audited non-destructive physical uniqueness migration.
- `docs/verification/automation-rest-smoke.json` — manual REST evidence; not an n8n execution record.
- `docs/verification/automation-n8n-smoke.json` — actual manual n8n results, child request revision evidence and cleanup checks.

Changes are uncommitted/unpushed. A push to main would trigger deployment, so it requires the user's separate release approval.

### Runtime corrections

Early diagnostic executions returned structured `INVALID_JSON` until the unsupported Send Body expression was replaced with static `true` in both generator/export and remote HTTP node. Later create attempts hit HTTP 500 `CONTENT_CREATE_ERROR`: an older trashed REST fixture reserved the same automatically generated slug. A distinct n8n fixture title resolved this; successful execution `399936` proves the corrected create path. The key/slug reservations remain recoverable in Trash. No access settings were broadened to execute tests.
