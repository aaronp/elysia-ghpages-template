.PHONY: gen test

BASE_URL ?= https://aaronp.github.io/elysia-ghpages-template/

gen:
	bun install --frozen-lockfile
	bun run gen

test:
	bun install --frozen-lockfile
	OPENAPI_URL=$(BASE_URL)openapi.json bun run gen
	BASE_URL=$(BASE_URL) bun run test.ts


