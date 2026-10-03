# n8n instance-level MCP access

Verified 3 October 2026 (Europe/Sofia). Use the installed Cloudflare plugin for the `Kisimoff` account, not the manually configured `estudio` MCP.

## Cloudflare fix

Account `9a7534bb0df238bf9ef0fcfab1a3d3d2`, zone `tipsterplus.com` (`3765b86a3bb657e4d1c7cc79fb7a7deb`). Browser Integrity Check was enabled and the diagnostic POST to the instance-level MCP endpoint returned Cloudflare 403 / Error 1010.

Added a single configuration rule through the authorized Cloudflare plugin:

- Phase: `http_config_settings`.
- Ruleset: `af003ab74d834c2c9707c607f8e41230`.
- Rule: `c0b240f24bd14592b4708a10a65d7fc9`.
- Ref: `n8n_mcp_bic_exception_v1`.
- Action: `set_config`, parameters `{ "bic": false }`.
- Expression: `(http.host eq "auto.tipsterplus.com" and http.request.uri.path in {"/mcp-server/http" "/mcp-server/http/"})`.

Readback confirmed Browser Integrity Check remains on globally, the existing Zaraz configuration rule is unchanged, and the country-block rule in `http_request_firewall_custom` is unchanged. No WAF/rate-limiting/authentication bypass was added. The narrow rule removes a browser-specific check from the authenticated API endpoint only.

## Authentication findings — earlier diagnostic

After the Cloudflare rule, the same diagnostic client reached n8n:

- No Bearer header: HTTP 401, `Unauthorized: Authorization header not sent`.
- Configured MCP Bearer token: HTTP 401, `Unauthorized`.
- n8n management MCP: works.
- n8n instance MCP `prepare`: `OFFICIAL_MCP_AUTH_FAILED`.

At that earlier check, `N8N_MCP_ACCESS_TOKEN` equalled `N8N_API_KEY`, and n8n rejected that value at its MCP endpoint. Replace only `N8N_MCP_ACCESS_TOKEN` with the Access token from Settings → Instance-level MCP → Connection details. Keep the working management `N8N_API_KEY`. Restart the MCP server, then repeat `n8n_test_workflow(method:prepare)`.

## Current authentication and pipeline status

Rechecked later on 3 October 2026: `n8n_health_check` succeeds, `n8n_test_workflow(method:prepare)` succeeds through official MCP, and real manual execution works. The rejected-token findings above are historical, not a current blocker. No additional callback allowlist or Cloudflare change was necessary in this session. The current connection uses an access token; OAuth callback settings apply only to clients using OAuth.

News Pipeline has passed live acceptance with ten published articles and is now scheduled every 15 minutes. The temporary schedule hold was removed. See `news-pipeline-v1.md` and `verification/news-pipeline-v1-acceptance.json`. No raw token is present in these documents, the workflow export or diagnostic evidence.

## Rollback

Delete only rule `c0b240f24bd14592b4708a10a65d7fc9` from ruleset `af003ab74d834c2c9707c607f8e41230` to restore the former BIC behavior. Do not replace the ruleset or disable BIC globally.
