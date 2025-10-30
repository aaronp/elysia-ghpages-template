# Elysia + Bun: Static KERI Data → REST + Swagger (GH Pages Export)

This template turns a directory of JSON files (e.g. `kel/`, `ksn/`, `tel/`) into **REST GET endpoints** using **Elysia (Bun)**,
and can also **export static docs** (OpenAPI + Swagger UI) that you can publish with **GitHub Pages**.

## Features
- Auto-routes `GET /kel/**`, `GET /ksn/**`, `GET /tel/**` from files under `./data/{kel,ksn,tel}`
- Optional `metadata.json` files per directory to enrich Swagger docs (summary, description, tags)
- Live server with Elysia + `@elysiajs/swagger` at `/swagger` and `/openapi.json`
- Static export to `./pages/` containing:
  - `openapi.json`
  - Swagger UI (`index.html`, assets)
  - Your data folder(s), preserving structure

## Quick Start

1) **Install Bun** (https://bun.sh) and install deps:
```bash
bun install
```

2) **Run dev server**:
```bash
bun run dev
```
- Browse: http://localhost:3000/swagger (interactive docs)
- Example: http://localhost:3000/kel/sample-id/data  (if `data/kel/sample-id/data.json` exists)

3) **Install this template into a new directory (one-liner)**:
```bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/<branch>/scripts/install.sh \
  | bash -s -- --repo <owner>/<repo> --branch <branch> --dir my-project
```
- Replace `<owner>/<repo>` and `<branch>` (defaults to `master` if omitted). Example:
```bash
curl -fsSL https://raw.githubusercontent.com/<owner>/<repo>/master/scripts/install.sh \
  | bash -s -- --repo <owner>/<repo> --dir my-keri-api
```

4) **Generate static pages for GitHub Pages**:
```bash
bun run export
```
- Outputs to `./pages/`:
  - `/openapi.json`
  - `/index.html` (Swagger UI)
  - `/swagger-ui-assets/*`
  - `/kel`, `/ksn`, `/tel` copied from `./data`

5) **Publish with GitHub Pages**:
   - Commit the repo
   - In your GitHub repository settings, enable **Pages** for the `pages/` folder on the `main` branch.
   - Your Swagger UI will be available at `https://<user>.github.io/<repo>/` and the `openapi.json` at
     `https://<user>.github.io/<repo>/openapi.json`.
   - Data is served statically at the same relative paths (e.g., `/kel/...`), so external clients can fetch files directly.

### Installer details
- The installer downloads a tarball from GitHub and copies files into the target directory.
- It accepts:
  - `--repo <owner/repo>` (required)
  - `--branch <branch>` (default: `master`)
  - `--dir <target-dir>` (default: current directory)
  - `--no-install` to skip `bun install`
- After installation:
  - `bun run dev` to serve docs at `http://localhost:3000/swagger`
  - `bun run export` to produce static site under `./pages/`

## Directory Structure
```text
data/
  kel/
    sample-id/
      data.json
      metadata.json      # optional; applies to files in this directory (see format below)
  ksn/
  tel/
src/
  server.ts             # Elysia server (live mode)
  exporter.ts           # Static OpenAPI + Swagger UI exporter
  types.ts
  metadata.ts
  walk.ts
```

## `metadata.json` format
Place a `metadata.json` in any data directory. It applies to all JSON files in that directory (not recursively).
You can override at a deeper folder by adding another `metadata.json` there.

```jsonc
{
  "tags": ["KEL"],
  "summary": "Key Event Log files for this AID",
  "description": "Each JSON file is exposed as a GET endpoint. Response is the file contents."
}
```

## Notes
- The Swagger schemas for responses are generic JSON (unknown structure). If you want stricter schemas, extend `exporter.ts` to
  parse each file and derive JSON Schema or provide schemas in metadata.
- The static export does **not** run Elysia on GitHub Pages. It publishes your **OpenAPI** + **Swagger UI** + **raw files** so
  anyone can browse docs and fetch raw JSON via static hosting.
