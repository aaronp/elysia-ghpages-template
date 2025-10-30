/*
  Simple smoke test that uses the generated swagger-typescript-api HttpClient
  to GET a few known endpoints from the static site.
*/
// Load the generated client at runtime to avoid import-time failures before generation
async function loadHttpClient(): Promise<any> {
  const mod = await import('./src/api/client.ts')
  // Prefer exported HttpClient; some templates export Api only
  return (mod as any).HttpClient || (mod as any).Api || (mod as any).Client || mod
}

const BASE_URL = (process.env.BASE_URL || 'https://aaronp.github.io/elysia-ghpages-template/').replace(/\/$/, '/')

async function get(client: any, path: string) {
  const url = path.replace(/^\//, '')
  if (typeof client.request === 'function') {
    const res = await client.request({ path: url, method: 'GET', format: 'json' })
    return res
  }
  // Fallback: direct fetch using client's base if provided
  const base = (client && client.baseUrl) ? String(client.baseUrl) : BASE_URL
  const r = await fetch(base.replace(/\/$/, '/') + url)
  return await r.json()
}

async function main() {
  console.log('BASE_URL =', BASE_URL)
  const HttpClientCtor = await loadHttpClient()
  const client = (typeof HttpClientCtor === 'function')
    ? new HttpClientCtor({ baseUrl: BASE_URL })
    : { baseUrl: BASE_URL }

  // Always present from export
  const openapi = await get(client, 'openapi.json')
  console.log('openapi.json ok:', typeof openapi === 'object')

  // Sample data present in repo
  const kel = await get(client, 'kel/sample-id/data.json')
  console.log('kel/sample-id/data.json ok:', typeof kel === 'object')

  const tel = await get(client, 'tel/another-id/foo/bar.json')
  console.log('tel/another-id/foo/bar.json ok:', typeof tel === 'object')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


