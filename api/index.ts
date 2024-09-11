import * as endpoint from "./endpoint"
import * as openapi from "./openapi"
import * as A from "effect/Array"
import * as R from "effect/Record"
import { pipe } from "effect"
import * as YAML from "yaml"
import fs from "fs"
import * as types from "./types"
import { apiToHTML } from "./html"

export * as endpoint from "./endpoint"
export * as types from "./types"

export type API = {
  title: string
  description?: string
  version: openapi.Version
  endpoints: endpoint.Endpoint[]
}

export const apiToOpenAPI = (api: API): openapi.OpenAPI => ({
  openapi: "3.0.0",
  info: {
    title: api.title,
    description: api.description ?? "",
    version: api.version,
  },
  paths: pipe(
    api.endpoints,
    A.map(e => [e.path, endpoint.openAPI(e)] as const),
    R.fromEntries,
  ),
})

const apiToYAML = function (api: API): string {
  const openAPISchema = apiToOpenAPI(api)
  const yaml = YAML.stringify(openAPISchema, {
    strict: true,
    aliasDuplicateObjects: false,
  })
  return yaml
}

const apiToTS = function (api: API): string {
  const serializers = pipe(
    api.endpoints,
    A.filter(e => e.stream?.serializerName !== undefined),
    A.map(e => ({
      serializer: e.stream!.serializerName,
      endpoint: e.path,
      response: types.schema(e.response),
    })),
  )
  const serializersCode =
    serializers.length === 0
    ? "{}"
    : `
{
  ${pipe(
    serializers,
    A.map(s => `...{ "${s.serializer}": ${s.response} },`),
    A.join("\n"),
  )}
} satisfies
  ${pipe(
    serializers,
    A.map(s => `{ ${s.serializer}: (typeof endpoints)["${s.endpoint}"]["response"] }`),
    A.join(" &\n"),
  )}
  `
  return `
import * as S from "@effect/schema/Schema"

export const endpoints = {
  ${pipe(
    api.endpoints,
    A.map(e => `"${e.path}": {
      method: "${e.method}" as const,
      path: "${e.path}",
      request: ${types.schema(e.request)},
      response: ${types.schema(e.response)},
      responseDefault: ${types.defaultValue(e.response ?? types.object({}))},
      errors: ${
        e.errors.length > 0
        ? pipe(e.errors, types.enum_, types.schema)
        : `S.Never`
      },
      isStream: ${e.stream !== undefined} as const,
      streamSerializer: "${e.stream?.serializerName ?? ""}" as const,
    },`),
    A.join("\n"),
  )}
}

export const serializers = ${serializersCode}
  `
}

interface Exports {
  yaml?: string
  ts?: string
  html?: string
}

export const createAPI = function (api: API, exports: Exports) {
  if (endpoint.hasDuplicates(api.endpoints))
    throw new Error("Duplicate endpoints")
  if (exports.yaml !== undefined) {
    const yaml = apiToYAML(api)
    fs.writeFileSync(exports.yaml, yaml)
  }
  if (exports.ts !== undefined) {
    const ts = apiToTS(api)
    fs.writeFileSync(exports.ts, ts)
  }
  if (exports.html !== undefined) {
    const html = apiToHTML(api)
    fs.writeFileSync(exports.html, html)
  }
}
