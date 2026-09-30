#!/usr/bin/env node
// TopSMS MCP server: umoznuje AI asistentum (Claude, ChatGPT, Cursor...) posilat SMS pres TopSMS REST API.
// Konfigurace: env TOPSMS_CLIENT_ID a TOPSMS_SECRET (API klic z dashboardu TopSMS), volitelne TOPSMS_BASE_URL.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const BASE = (process.env.TOPSMS_BASE_URL || 'https://www.topsms.cz').replace(/\/$/, '')
const CLIENT_ID = process.env.TOPSMS_CLIENT_ID || ''
const SECRET = process.env.TOPSMS_SECRET || ''
const VERSION = '1.1.0'

async function api(method, path, body, extraHeaders = {}) {
  if (!CLIENT_ID || !SECRET) {
    throw new Error('Missing TOPSMS_CLIENT_ID or TOPSMS_SECRET. Create an API key in the TopSMS dashboard (API klíče) and set both environment variables.')
  }
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${CLIENT_ID}:${SECRET}`,
      'Content-Type': 'application/json',
      'User-Agent': `topsms-mcp/${VERSION}`,
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try { data = JSON.parse(text) } catch { data = { raw: text } }
  if (!res.ok && res.status !== 202) {
    const msg = (data && data.error) || text || res.statusText
    throw new Error(`TopSMS API ${res.status}: ${msg}`)
  }
  return data
}

const ok = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] })
const fail = (e) => ({ isError: true, content: [{ type: 'text', text: String(e && e.message ? e.message : e) }] })
const wrap = (fn) => async (args) => { try { return ok(await fn(args)) } catch (e) { return fail(e) } }

const server = new McpServer({ name: 'topsms', version: VERSION })

const phone = z.string().min(6).describe('Phone number in international format, e.g. +420601234567 (Czech numbers without prefix are accepted).')
const sender = z.string().max(11).optional().describe('Approved Sender ID (max 11 chars). Omit to use the default sender "TopSMS".')
const sendAt = z.string().optional().describe('Schedule for later: ISO 8601 with timezone, e.g. 2026-10-01T09:00:00+02:00 (max 30 days ahead). Omit to send now. Scheduled sends return a jobId that can be cancelled with cancel_scheduled.')
const idem = z.string().max(255).optional().describe('Optional Idempotency-Key (e.g. a UUID). Repeating a call with the same key never sends the SMS twice; the original response is returned.')
const idemHeader = (k) => (k ? { 'Idempotency-Key': k } : {})

server.tool(
  'send_sms',
  'Send one SMS message via TopSMS (Czech SMS gateway). Costs credit: 160 chars without diacritics = 1 SMS, 70 with diacritics/emoji. Returns message id, number of segments and price in CZK.',
  { to: phone, text: z.string().min(1).max(1600).describe('Message text.'), from: sender, send_at: sendAt, idempotencyKey: idem },
  wrap(({ to, text, from, send_at, idempotencyKey }) => api('POST', '/api/sms/send', { to, text, ...(from ? { from } : {}), ...(send_at ? { send_at } : {}) }, idemHeader(idempotencyKey))),
)

server.tool(
  'send_bulk_sms',
  'Send the same SMS text to up to 500 recipients. Batches over 50 recipients are queued (HTTP 202) and return a jobId; use get_bulk_job to follow progress.',
  {
    to: z.array(z.string()).min(1).max(500).describe('Phone numbers in international format.'),
    text: z.string().min(1).max(1600).describe('Common message text.'),
    from: sender,
    send_at: sendAt,
    idempotencyKey: idem,
  },
  wrap(({ to, text, from, send_at, idempotencyKey }) => api('POST', '/api/sms/send-bulk', { to, text, ...(from ? { from } : {}), ...(send_at ? { send_at } : {}) }, idemHeader(idempotencyKey))),
)

server.tool(
  'get_message_status',
  'Get delivery status of a sent message (queued, sent, delivered, failed, expired) with timestamps, errorMessage and machine-readable errorCode (expired, undelivered, rejected, deleted, unknown, repeated_failure, not_sent), by message id or external id.',
  { id: z.string().min(3).describe('Message id or externalId returned when sending.') },
  wrap(({ id }) => api('GET', `/api/sms/status/${encodeURIComponent(id)}`)),
)

server.tool(
  'get_bulk_job',
  'Get progress of a queued bulk send (status, sent, failed, queued counts and per-message results).',
  { jobId: z.string().min(3).describe('jobId returned by send_bulk_sms.'), results: z.boolean().optional().describe('Include per-message results (default true).') },
  wrap(({ jobId, results }) => api('GET', `/api/sms/jobs/${encodeURIComponent(jobId)}${results === false ? '?results=0' : ''}`)),
)

server.tool(
  'cancel_scheduled',
  'Cancel a scheduled send (or a queued bulk job that has not started yet). Unsent messages are removed and their price is returned to credit.',
  { jobId: z.string().min(3).describe('jobId returned by send_sms / send_bulk_sms with send_at.') },
  wrap(({ jobId }) => api('DELETE', `/api/sms/jobs/${encodeURIComponent(jobId)}`)),
)

server.tool(
  'verify_send',
  'Send a one-time verification code (OTP) by SMS for login, registration or payment confirmation. TopSMS generates and stores the code; returns a verification id. Limits: 5 codes per number per hour, 30 s between codes.',
  {
    to: phone,
    brand: z.string().max(30).optional().describe('Your app or company name shown in the SMS ("MyShop: your verification code is ...").'),
    length: z.number().int().min(4).max(8).optional().describe('Code length 4-8 digits (default 6).'),
    ttl: z.number().int().min(60).max(1800).optional().describe('Validity in seconds, 60-1800 (default 300).'),
    locale: z.enum(['cs', 'en']).optional().describe('SMS language (default cs).'),
    from: sender,
  },
  wrap((args) => api('POST', '/api/verify/send', Object.fromEntries(Object.entries(args).filter(([, v]) => v !== undefined)))),
)

server.tool(
  'verify_check',
  'Check a verification code the user entered. Returns valid true/false, status (approved, pending, expired, failed, canceled) and attempts left (max 5 attempts per code).',
  {
    id: z.string().min(3).optional().describe('Verification id returned by verify_send (preferred).'),
    to: z.string().optional().describe('Alternatively the phone number; checks the latest code sent to it.'),
    code: z.string().min(4).max(8).describe('Code entered by the user.'),
  },
  wrap(({ id, to, code }) => {
    if (!id && !to) throw new Error('Provide id (from verify_send) or to (phone number).')
    return api('POST', '/api/verify/check', { ...(id ? { id } : { to }), code })
  }),
)

server.tool(
  'get_credit',
  'Get the current TopSMS credit balance (CZK) and the price per SMS for this account.',
  {},
  wrap(() => api('GET', '/api/credit')),
)

server.tool(
  'get_pricing',
  'Get the public TopSMS price list (tiers, prices per destination zone in CZK and EUR, Sender ID fee, billing rules). Does not require credentials.',
  {},
  async () => {
    try {
      const res = await fetch(BASE + '/pricing.json', { headers: { 'User-Agent': `topsms-mcp/${VERSION}` } })
      return ok(await res.json())
    } catch (e) { return fail(e) }
  },
)

await server.connect(new StdioServerTransport())
