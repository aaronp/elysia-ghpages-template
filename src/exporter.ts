import { mkdirSync, writeFileSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { buildRoutesFromData } from './walk'

const baseDirs = ['kel', 'ksn', 'tel'] as const
const dataRoot = 'data'
const outRoot = 'pages'
// Using Scalar for static docs; no local assets needed

const routes = buildRoutesFromData(baseDirs, dataRoot)
const paths: Record<string, any> = {}

for (const r of routes) {
  paths[r.path] = {
    get: {
      tags: r.tags,
      summary: r.summary,
      description: r.description,
      responses: {
        '200': {
          description: 'JSON file contents',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: true }
            }
          }
        },
        '404': { description: 'Not found' }
      }
    }
  }
}

const openapi = {
  openapi: '3.0.3',
  info: {
    title: 'KERI Static Data API',
    version: '0.1.0',
    description: 'Auto-generated from data directory'
  },
  servers: [
    { url: './' }
  ],
  paths
}

mkdirSync(outRoot, { recursive: true })
writeFileSync(join(outRoot, 'openapi.json'), JSON.stringify(openapi, null, 2))

// No asset copying needed for Scalar; we load from CDN

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>KERI Static Data API</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style> body { margin: 0; } </style>
  </head>
  <body>
    <div id="api-reference"></div>
    <script src="https://unpkg.com/@scalar/api-reference@latest/dist/browser/standalone.js"></script>
    <script>
      // Initialize Scalar with dark mode and hide test requests (static hosting)
      window.ScalarAPIReference && window.ScalarAPIReference({
        theme: 'moon',
        darkMode: true,
        hideTestRequestButton: true,
        spec: { url: './openapi.json' }
      }).render('#api-reference');
    </script>
  </body>
</html>`

writeFileSync(join(outRoot, 'index.html'), html)

// Copy data directories to pages/
for (const base of baseDirs) {
  try {
    cpSync(join(process.cwd(), dataRoot, base), join(outRoot, base), { recursive: true })
  } catch {}
}

console.log(`✓ Exported Swagger UI + OpenAPI to ./${outRoot}`)
