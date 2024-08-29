import * as types from "../types"
import * as openapi from "../openapi"

type Error = Uppercase<string>

interface EndpointConfig {
  /**
   * The path of the endpoint
   */
  path: `/${string}`
  /**
   * A brief description of the endpoint
   */
  description?: string
  /**
   * The HTTP method of the endpoint
   * default is "post"
   */
  method?: openapi.Method
  /**
   * The request schema of the endpoint
   */
  request?: types.TValue
  /**
   * The response schema of the endpoint
   */
  response?: types.TValue
  /**
   * The error codes of the endpoint
   */
  errors?: Error[]
  /**
   * If set, the endpoint will be a stream
   */
  stream?: {
    serializerName: string
  }
}

export interface Endpoint {
  path: string
  description: string
  method: openapi.Method
  request?: types.TValue
  response?: types.TValue
  errors: Error[]
  stream?: {
    serializerName: string
  },
}

export const createEndpoint = (endpoint: EndpointConfig): Endpoint => ({
  path: endpoint.path,
  description: endpoint.description ?? "",
  method: endpoint.method ?? "post",
  request: endpoint.request,
  response: endpoint.response,
  errors: endpoint.errors ?? [],
  stream: endpoint.stream,
})

export const openAPI = (endpoint: Endpoint): openapi.PathItem => {
  return {
    [endpoint.method]: {
      summary: endpoint.description,
      description: endpoint.description,
      operationId: endpoint.path,
      requestBody: endpoint.request ? {
        content: {
          "application/json": {
            schema: types.openAPI(endpoint.request),
          }
        }
      } : undefined,
      responses: {
        200: {
          description: "Success",
          content: endpoint.response ? {
            "application/json": {
              schema: types.openAPI(endpoint.response),
            }
          } : undefined,
        }
      }
    }
  } as const satisfies openapi.PathItem
}

export const hasDuplicates = (endpoints: Endpoint[]): boolean => {
  const paths = endpoints.map(e => e.path)
  return new Set(paths).size !== paths.length
}
