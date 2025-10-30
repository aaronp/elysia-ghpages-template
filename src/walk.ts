import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export type RouteDef = {
  path: string
  file: string
  tags: string[]
  summary?: string
  description?: string
  loader: () => any
}

type DirMeta = {
  tags?: string[]
  summary?: string
  description?: string
}

function readDirMeta(dir: string): DirMeta | undefined {
  const metaPath = join(dir, 'metadata.json')
  if (existsSync(metaPath)) {
    try {
      return JSON.parse(readFileSync(metaPath, 'utf-8'))
    } catch {}
  }
  return undefined
}

export function buildRoutesFromData(baseDirs: readonly string[], dataRoot = 'data'): RouteDef[] {
  const routes: RouteDef[] = []
  for (const base of baseDirs) {
    const basePath = join(process.cwd(), dataRoot, base)
    if (!existsSync(basePath)) continue

    const stack: string[] = [basePath]
    while (stack.length) {
      const dir = stack.pop()!
      const items = readdirSync(dir)
      const meta = readDirMeta(dir)

      for (const name of items) {
        const p = join(dir, name)
        const s = statSync(p)
        if (s.isDirectory()) {
          stack.push(p)
          continue
        }
        if (!name.endsWith('.json')) continue

        const rel = relative(join(process.cwd(), dataRoot), p).replaceAll(sep, '/')
        const apiPath = '/' + rel.replace(/\.json$/i, '')

        routes.push({
          path: apiPath,
          file: p,
          tags: meta?.tags ?? [base.toUpperCase()],
          summary: meta?.summary,
          description: meta?.description,
          loader: () => JSON.parse(readFileSync(p, 'utf-8'))
        })
      }
    }
  }
  return routes
}
