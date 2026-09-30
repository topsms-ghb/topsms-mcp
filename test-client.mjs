// Test: spusti MCP server pres stdio, vypise nastroje a zavola get_credit + get_pricing (zadne SMS neposila).
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const transport = new StdioClientTransport({ command: 'node', args: ['index.js'], env: { ...process.env } })
const client = new Client({ name: 'test', version: '0.0.1' })
await client.connect(transport)
const tools = await client.listTools()
console.log('TOOLS:', tools.tools.map(t => t.name).join(', '))
const credit = await client.callTool({ name: 'get_credit', arguments: {} })
console.log('get_credit:', credit.isError ? 'ERROR ' : '', credit.content[0].text.replace(/\s+/g, ' '))
const pricing = await client.callTool({ name: 'get_pricing', arguments: {} })
console.log('get_pricing:', pricing.isError ? 'ERROR ' : '', pricing.content[0].text.replace(/\s+/g, ' ').slice(0, 160))
const bad = await client.callTool({ name: 'get_message_status', arguments: { id: 'neexistuje123' } })
console.log('get_message_status (neexistujici):', bad.isError ? 'isError' : 'ok', bad.content[0].text.slice(0, 120))
await client.close()
