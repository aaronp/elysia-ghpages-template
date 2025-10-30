import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { generateApi } from 'swagger-typescript-api'

const DEFAULT_LOCAL_SPEC = join(process.cwd(), '..', 'pages', 'openapi.json')
const OUT_DIR = join(process.cwd(), 'src', 'api')

async function main() {
  const openapiUrl = process.env.OPENAPI_URL || ''
  const useUrl = /^https?:\/\//i.test(openapiUrl)
  const input = useUrl ? { url: openapiUrl } : { input: DEFAULT_LOCAL_SPEC }

  console.log('Generating client from', useUrl ? openapiUrl : DEFAULT_LOCAL_SPEC)
  mkdirSync(OUT_DIR, { recursive: true })

  await generateApi({
    name: 'client.ts',
    output: OUT_DIR,
    httpClientType: 'fetch',
    prettier: { printWidth: 100, singleQuote: true },
    singleHttpClient: true,
    modular: false,
    silent: false,
    hooks: {
      onCreateComponent: (c) => c,
    },
    ...input
  })

  console.log(`✓ Client generated at ${OUT_DIR}/client.ts`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})


