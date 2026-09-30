# TopSMS MCP server

Send SMS from Claude, ChatGPT, Cursor and other AI assistants through [TopSMS](https://www.topsms.cz), a Czech SMS gateway for businesses (Czech Republic, Slovakia and 200+ countries).

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

1. Create a free account at [topsms.cz](https://www.topsms.cz/?registrace) (10 free SMS).
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

0.88–0.98 CZK (≈ €0.036–0.040) per SMS to Czech and Slovak numbers, no monthly fees, credit never expires. EU 2 CZK, rest of world 3 CZK per segment. Full list: https://www.topsms.cz/pricing.json

## Notes

- Every `send_*` call spends real credit. AI clients usually ask for confirmation before calling tools; keep that enabled.
- 160 characters without diacritics = 1 SMS, 70 with diacritics or emoji.
- API docs: https://www.topsms.cz/api-integrace/rest-api · Support: info@topsms.cz

## License

MIT
