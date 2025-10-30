import { Elysia } from 'elysia'
import { swagger } from '@elysiajs/swagger'
import { buildRoutesFromData, type RouteDef } from './walk'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const app = new Elysia()

const baseDirs = ['kel', 'ksn', 'tel'] as const
const routes: RouteDef[] = buildRoutesFromData(baseDirs, 'data')

for (const r of routes) {
  app.get(r.path, () => r.loader(), {
    detail: {
      tags: r.tags,
      summary: r.summary,
      description: r.description,
      responses: {
        200: {
          description: 'JSON file contents',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        404: { description: 'Not found' }
      }
    }
  })
}

app.get('/raw/*', ({ request }) => {
  const url = new URL(request.url)
  const rel = url.pathname.replace(/^\/raw\//, '')
  const p = join(process.cwd(), 'data', rel)
  if (!existsSync(p)) return new Response('Not found', { status: 404 })
  const body = readFileSync(p, 'utf-8')
  return new Response(body, { headers: { 'content-type': 'application/json' } })
}, {
  detail: {
    tags: ['debug'],
    summary: 'Serve raw files from /data',
    description: 'Convenience endpoint to view the raw JSON without OpenAPI shape.'
  }
})

app.use(swagger({
  path: '/swagger',
  documentation: {
    info: {
      title: 'KERI Static Data API',
      version: '0.1.0',
      description: 'Auto-generated routes from ./data/{kel,ksn,tel}'
    },
    tags: [
      { name: 'KEL' },
      { name: 'KSN' },
      { name: 'TEL' },
      { name: 'debug' }
    ]
  },
  scalarConfig: {
    darkMode: true
  }
}))

app.listen(3000)
console.log('⚡ Elysia running at http://localhost:3000 (docs at /swagger)')
