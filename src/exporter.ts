import { mkdirSync, writeFileSync, cpSync } from 'node:fs'
import { join } from 'node:path'
import { buildRoutesFromData } from './walk'

const baseDirs = ['kel', 'ksn', 'tel'] as const
const dataRoot = 'data'
const outRoot = 'pages'
const swaggerAssetsDir = 'swagger-ui-assets'

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

// Copy swagger-ui-dist assets and create index.html
// eslint-disable-next-line @typescript-eslint/no-var-requires
const modulePath = require.resolve('swagger-ui-dist')
const moduleRoot = modulePath.slice(0, modulePath.lastIndexOf('swagger-ui-dist')) + 'swagger-ui-dist'
const assets = [
  'swagger-ui.css',
  'swagger-ui-bundle.js',
  'swagger-ui-standalone-preset.js',
  'favicon-16x16.png',
  'favicon-32x32.png'
]

mkdirSync(join(outRoot, swaggerAssetsDir), { recursive: true })
for (const f of assets) {
  const src = join(moduleRoot, f)
  const dst = join(outRoot, swaggerAssetsDir, f)
  // @ts-ignore
  writeFileSync(dst, require('node:fs').readFileSync(src))
}

const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>KERI Static Data API</title>
    <link rel="stylesheet" href="./${swaggerAssetsDir}/swagger-ui.css" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style> body { margin: 0 } </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./${swaggerAssetsDir}/swagger-ui-bundle.js"></script>
    <script src="./${swaggerAssetsDir}/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: './openapi.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        // Ensure requests go to the GitHub Pages subpath (repo name)
        // so "/kel/..." becomes "/<repo>/kel/..." when hosted under Pages.
        requestInterceptor: function (req) {
          try {
            var path = window.location.pathname;
            var lastSlash = path.lastIndexOf('/');
            var pageDir = lastSlash >= 0 ? path.slice(0, lastSlash + 1) : '/';
            var base = pageDir.charAt(pageDir.length - 1) === '/' ? pageDir : (pageDir + '/');

            var u = req.url;
            var isHttp = /^https?:\/\//i.test(u);
            if (!isHttp) {
              if (u.slice(0, 2) === './') u = u.slice(2);
              if (u.charAt(0) === '/') {
                u = base + u.slice(1);
              } else {
                u = base + u;
              }
              // Append .json for API routes so static hosting finds files
              var needsJson = (u.indexOf('/kel/') >= 0 || u.indexOf('/ksn/') >= 0 || u.indexOf('/tel/') >= 0);
              if (needsJson && u.slice(-5).toLowerCase() !== '.json') {
                u = u + '.json';
              }
              req.url = u;
            }
          } catch (e) {}
          return req;
        }
      })
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
