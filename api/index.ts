import * as endpoint from "./endpoint"
import * as openapi from "./openapi"
import * as A from "effect/Array"
import * as R from "effect/Record"
import { pipe } from "effect"
import * as YAML from "yaml"
import fs from "fs"

export * as endpoint from "./endpoint"
export * as types from "./types"

type API = {
  title: string
  description?: string
  version: openapi.Version
  endpoints: endpoint.Endpoint[]
}

export const createAPI = function (api: API) {
  if (endpoint.hasDuplicates(api.endpoints))
    throw new Error("Duplicate endpoints")
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
  console.log(yaml)
  fs.writeFileSync("openapi.yaml", yaml)
}
