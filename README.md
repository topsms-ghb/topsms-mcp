# TopSMS MCP server

Send SMS from Claude, ChatGPT, Cursor and other AI assistants through **TopSMS (topsms.eu / topsms.cz)**, an SMS gateway for businesses with two sites:

- [topsms.eu](https://topsms.eu) – English, German, Italian, Spanish and Portuguese; accounts in EUR; for Germany, Austria and the EU.
- [www.topsms.cz](https://www.topsms.cz) – Czech and Slovak; accounts in CZK.

Both sites share one API: REST API, Verify (OTP) API, webhooks with delivery reports, and test API keys that send nothing and cost nothing. Prepaid credit, no monthly fee, no setup fee, credit never expires.

There are two ways to connect:

- **Remote MCP server** `https://topsms.eu/api/mcp` – nothing to install; sign in with OAuth or send an API key in the `Authorization` header.
- **This npm package `topsms-mcp`** – a local stdio server for clients that start MCP servers as a command.

## Tools

| Tool | What it does |
|---|---|
| `send_sms` | Send one SMS (number, text, optional sender name, optional `send_at` to schedule, optional idempotency key) |
| `send_bulk_sms` | Same text to up to 500 numbers; over 50 recipients it is queued and returns a `jobId` |
| `get_message_status` | Delivery status of a message (queued, sent, delivered, failed, expired) |
| `get_bulk_job` | Progress of a queued or scheduled send |
| `cancel_scheduled` | Cancel a scheduled send (the price is returned to credit) |
| `verify_send` | Send a one-time verification code (OTP) by SMS |
| `verify_check` | Check the code the user entered |
| `get_credit` | Credit balance and price per SMS in the account currency (EUR or CZK) |
| `get_pricing` | Public price list (no credentials needed) |

## Quick start

1. Create an account at [topsms.eu](https://topsms.eu/#register) (EUR account, €0.50 sign-up credit, about 5 SMS) or [www.topsms.cz](https://www.topsms.cz/?registrace) (CZK account, 10 test SMS).
2. Connect your AI client, either to the remote server (option A) or with the npm package (option B).

For development, create a **test API key** in the dashboard: every tool works, but nothing is sent and nothing is charged.

### Option A: remote server (OAuth, nothing to install)

Endpoint: `https://topsms.eu/api/mcp` (Streamable HTTP). Accounts created on www.topsms.cz may also use `https://www.topsms.cz/api/mcp`.

- **Claude (claude.ai, desktop and mobile apps):** Settings → Connectors → Add custom connector, URL `https://topsms.eu/api/mcp`, leave the OAuth client ID and secret empty, Connect, sign in to TopSMS and allow access. Custom connectors depend on your Claude plan and organisation settings.
- **ChatGPT:** Settings → Apps & Connectors, enable Developer mode (advanced settings, available on some plans), create a connector with the URL `https://topsms.eu/api/mcp` and OAuth authentication, sign in to TopSMS and allow access.
- **Claude Code:** `claude mcp add --transport http topsms https://topsms.eu/api/mcp`, then run `/mcp` and sign in in the browser.
- **Cursor and other clients without OAuth:** send an API key in the header `Authorization: Bearer CLIENT_ID:SECRET`:

```json
{
  "mcpServers": {
    "topsms": {
      "url": "https://topsms.eu/api/mcp",
      "headers": { "Authorization": "Bearer CLIENT_ID:SECRET" }
    }
  }
}
```

Each OAuth connection appears in the TopSMS dashboard as an API key named "OAuth: <app name>"; revoke it there to disconnect.

### Option B: npm package (stdio)

In the dashboard open **API keys** (**API klíče** on topsms.cz), create a key with the scopes `send` and `read`, and copy the Client ID and Secret. Requires Node.js 18 or newer.

Claude Desktop, Cursor, Windsurf, VS Code and other stdio clients:

```json
{
  "mcpServers": {
    "topsms": {
      "command": "npx",
      "args": ["-y", "topsms-mcp"],
      "env": {
        "TOPSMS_CLIENT_ID": "your-client-id",
        "TOPSMS_SECRET": "your-secret"
      }
    }
  }
}
```

Claude Code: `claude mcp add topsms -e TOPSMS_CLIENT_ID=... -e TOPSMS_SECRET=... -- npx -y topsms-mcp`

The API key decides the account and its currency; the same package works for topsms.eu and topsms.cz accounts. Optional: `TOPSMS_BASE_URL` (default `https://www.topsms.cz`); set it to `https://topsms.eu` if you want `get_pricing` to return the EUR price list instead of the CZK one.

## Pricing

Prices as of 17 November 2026. All prices are final; no VAT is added.

- **EUR accounts (topsms.eu):** €0.089 per SMS segment to Germany, Austria and most EU countries (EU zone). Czech and Slovak numbers: €0.038–0.041 by monthly volume.
- **CZK accounts (www.topsms.cz):** 0,99 Kč per SMS to Czech and Slovak numbers; 0,96 Kč from 5 000 Kč monthly spend; 0,93 Kč from 15 000 Kč.
- No monthly fee, no setup fee. Credit never expires; unused credit is not refunded.
- Own alphanumeric sender name: on topsms.eu no fee for most EU countries (country rules apply, for example Austria's RTR register, Spain's CNMC registry, Italy's AGCOM registration for Italian VAT holders; France may require registration). On CZK accounts 500 Kč one-off for Czech and Slovak operators, no monthly fee.

Current prices: https://topsms.eu/pricing (EUR) · https://www.topsms.cz/cenik (CZK) · machine-readable https://topsms.eu/pricing.json · per country https://topsms.eu/countries. The `get_pricing` tool returns the current price list, so an assistant does not need to rely on this README.

## Notes

- Every `send_*` call spends real credit (except with a test key). AI clients usually ask for confirmation before calling tools; keep that enabled.
- 160 characters in the GSM-7 alphabet (which includes German umlauts) = 1 SMS; 70 characters with other diacritics or emoji. Longer texts are split into segments of 153 or 67 characters; each segment is billed as one SMS.
- Docs: https://topsms.eu/docs (English) · https://topsms.eu/de/docs (Deutsch) · https://www.topsms.cz/api-integrace/rest-api (česky) · MCP: https://topsms.eu/mcp · OpenAPI: https://topsms.eu/openapi.yaml · Support: info@topsms.eu

## License

MIT
