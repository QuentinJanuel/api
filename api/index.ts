import * as endpoint from "./endpoint"
import * as openapi from "./openapi"
import * as A from "effect/Array"
import * as R from "effect/Record"
import { pipe } from "effect"
import * as YAML from "yaml"
import fs from "fs"
import * as types from "./types"

export * as endpoint from "./endpoint"
export * as types from "./types"

type API = {
  title: string
  description?: string
  version: openapi.Version
  endpoints: endpoint.Endpoint[]
}

const apiToYAML = function (api: API): string {
  const openAPISchema: openapi.OpenAPI = {
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
    )
  }
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
  return `
import * as S from "@effect/Schema/Schema"

export const endpoints = {
  ${pipe(
    api.endpoints,
    A.map(e => `"${e.path}": {
      method: "${e.method}",
      path: "${e.path}",
      request: ${types.schema(e.request)},
      response: ${types.schema(e.response)},
      errors: ${
        e.errors.length > 0
        ? pipe(e.errors, types.enum_, types.schema)
        : `S.Never`
      },
      isStream: ${e.stream !== undefined},
      streamSerializer: "${e.stream?.serializerName ?? ""}",
    },`),
    A.join("\n"),
  )}
}

export const serializers = {
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
}

export const createAPI = function (api: API) {
  if (endpoint.hasDuplicates(api.endpoints))
    throw new Error("Duplicate endpoints")
  const yaml = apiToYAML(api)
  const ts = apiToTS(api)
  fs.writeFileSync("openapi.yaml", yaml)
  fs.writeFileSync("schemas.ts", ts)
}
