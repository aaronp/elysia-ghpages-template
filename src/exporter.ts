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
    <style>
      body { margin: 0; background: #111; }
      .swagger-ui, .swagger-ui .info, .swagger-ui .opblock, .swagger-ui .scheme-container,
      .swagger-ui .topbar, .swagger-ui .information-container, .swagger-ui .wrapper { color: #e6e6e6; }
      .swagger-ui .opblock-tag, .swagger-ui .opblock .opblock-summary, .swagger-ui .model-title { color: #e6e6e6; }
      .swagger-ui .opblock { background: #1a1a1a; border-color: #333; }
      .swagger-ui .info .title, .swagger-ui .markdown p, .swagger-ui .markdown h1, .swagger-ui .markdown h2,
      .swagger-ui .markdown h3, .swagger-ui .markdown h4, .swagger-ui .markdown h5 { color: #fafafa; }
      .swagger-ui .tab li { color: #ddd; }
      .swagger-ui .btn, .swagger-ui .opblock .opblock-summary-control { background: #222; color: #eee; border-color: #444; }
      .swagger-ui .parameters-col_description, .swagger-ui .response-col_description { color: #ddd; }
      .swagger-ui .responses-inner { background: #161616; }
      .swagger-ui .response .response-control-media-type__accept-message { color: #bbb; }
      .swagger-ui .copy-to-clipboard { background: #222; }
      .swagger-ui .model { color: #ddd; }
      .swagger-ui .json-schema-2020-12__example, .swagger-ui .json-schema-2020-12__title { color: #ddd; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="./${swaggerAssetsDir}/swagger-ui-bundle.js"></script>
    <script src="./${swaggerAssetsDir}/swagger-ui-standalone-preset.js"></script>
    <script src="./sw-config.js"></script>
  </body>
</html>`

writeFileSync(join(outRoot, 'index.html'), html)

// Write external Swagger UI config to avoid inline parsing issues
const swConfig = `
(function(){
  function toBase(){
    var p = window.location.pathname;
    var i = p.lastIndexOf('/');
    var d = (i >= 0) ? p.slice(0, i + 1) : '/';
    if (d.length === 0) { d = '/'; }
    if (d.charAt(d.length - 1) !== '/') { d = d + '/'; }
    return d;
  }
  function sameOrigin(u){
    var loc = window.location;
    var o = (loc.origin) ? loc.origin : (loc.protocol + '//' + loc.host);
    return u.indexOf(o) === 0;
  }
  function trimTrailingSlash(s){
    if (!s) return s;
    return (s.charAt(s.length - 1) === '/') ? s.slice(0, -1) : s;
  }
  window.ui = SwaggerUIBundle({
    url: './openapi.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'BaseLayout',
    syntaxHighlight: { activate: true, theme: 'monokai' },
    requestInterceptor: function(req){
      try {
        var base = toBase();
        var u = req.url;
        var isHttp = /^https?:\/\//i.test(u);
        if (!isHttp) {
          if (u.slice(0, 2) === './') { u = u.slice(2); }
          if (u.charAt(0) === '/') { u = base + u.slice(1); } else { u = base + u; }
          var isDataRoute = (u.indexOf('/kel/') >= 0 || u.indexOf('/ksn/') >= 0 || u.indexOf('/tel/') >= 0);
          if (isDataRoute && u.slice(-5).toLowerCase() !== '.json') { u = u + '.json'; }
          req.url = u;
        } else if (sameOrigin(u)) {
          var loc = window.location; var o = (loc.origin) ? loc.origin : (loc.protocol + '//' + loc.host);
          var rel = u.slice(o.length);
          if (rel.charAt(0) !== '/') { rel = '/' + rel; }
          var baseNoSlash = trimTrailingSlash(base);
          if (rel.indexOf(baseNoSlash) !== 0) { rel = baseNoSlash + rel; }
          var isDataRouteAbs = (rel.indexOf('/kel/') >= 0 || rel.indexOf('/ksn/') >= 0 || rel.indexOf('/tel/') >= 0);
          if (isDataRouteAbs && rel.slice(-5).toLowerCase() !== '.json') { rel = rel + '.json'; }
          req.url = o + rel;
        }
      } catch (e) {}
      return req;
    }
  });
})();
`

writeFileSync(join(outRoot, 'sw-config.js'), swConfig)

// Copy data directories to pages/
for (const base of baseDirs) {
  try {
    cpSync(join(process.cwd(), dataRoot, base), join(outRoot, base), { recursive: true })
  } catch {}
}

console.log(`✓ Exported Swagger UI + OpenAPI to ./${outRoot}`)
