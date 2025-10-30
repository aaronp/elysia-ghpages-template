.PHONY: gen test

BASE_URL ?= https://aaronp.github.io/elysia-ghpages-template/

gen:
	bun install --frozen-lockfile
	bun run gen

test: gen
	BASE_URL=$(BASE_URL) bun run test.ts


