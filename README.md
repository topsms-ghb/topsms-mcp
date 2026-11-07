# TopSMS MCP server

Send SMS from Claude, ChatGPT, Cursor and other AI assistants through TopSMS, an SMS gateway for businesses with two front doors: [TopSMS.cz](https://www.topsms.cz) for the Czech Republic and Slovakia (billed in CZK) and [TopSMS.eu](https://topsms.eu) for Germany, Austria and the rest of the EU (billed in EUR). One API, 200+ countries, prepaid, no monthly fee, 10 free SMS on registration.

## Tools

| Tool | What it does |
|---|---|
| `send_sms` | Send one SMS (number, text, optional Sender ID, optional `send_at` to schedule, optional idempotency key) |
| `send_bulk_sms` | Same text to up to 500 numbers; over 50 recipients it is queued and returns a `jobId` |
| `get_message_status` | Delivery status of a message (queued, sent, delivered, failed, expired) |
| `get_bulk_job` | Progress of a queued bulk send |
| `cancel_scheduled` | Cancel a scheduled send (credit is returned) |
| `verify_send` | Send a one-time verification code (OTP) by SMS |
| `verify_check` | Check the code the user entered |
| `get_credit` | Credit balance in CZK and price per SMS |
| `get_pricing` | Public price list (no credentials needed) |

## Setup

1. Create a free account at [topsms.eu](https://topsms.eu/#register) (English/German, billed in EUR) or [topsms.cz](https://www.topsms.cz/?registrace) (Czech, billed in CZK). 10 free SMS either way.
2. In the dashboard open **API klíče** (API keys), create a key with scopes `send` and `read`, copy the Client ID and Secret.
3. Add the server to your MCP client.

### Claude Desktop / Claude Code

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

### Cursor, Windsurf, VS Code

Use the same `command`, `args` and `env` in the client's MCP configuration.

## Pricing

€0.084 per SMS to Germany, Austria and other EU countries, €0.036–0.040 to Czech and Slovak numbers, no monthly fees, credit never expires. Full price list: https://topsms.eu/#pricing (EUR) · https://www.topsms.cz/pricing.json (CZK).

## Notes

- Every `send_*` call spends real credit. AI clients usually ask for confirmation before calling tools; keep that enabled.
- 160 characters without diacritics = 1 SMS, 70 with diacritics or emoji.
- API docs: https://topsms.eu/docs (English) · https://topsms.eu/de/docs (Deutsch) · https://www.topsms.cz/api-integrace/rest-api (česky) · OpenAPI: https://topsms.eu/openapi.yaml · Support: info@topsms.cz

## License

MIT
