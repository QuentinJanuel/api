export type Version = `${number}.${number}.${number}`

type StringFormat = "uuid" | "binary"

export type Type =
  | { type: "null" }
  | { type: "boolean" }
  | { type: "integer" }
  | { type: "number" }
  | { type: "string" }
  | { type: "string", format: StringFormat }
  | { type: "string", enum: string[] }
  | { type: "enum", values: string[] }
  | { type: "array", items: Type, minItems?: number }
  | { type: "object", properties: Record<string, Type>, required: string[] }

interface Info {
  title: string;
  description: string;
  version: Version;
}

/**
 * The HTTP methods
 * For now, only POST is supported
 */
export type Method = "post"

export type PathItem = {
  [method in Method]: {
    summary: string;
    description: string;
    operationId: string;
    requestBody?: {
      content: {
        "application/json": {
          schema: Type
        }
      }
    }
    responses: {
      200: {
        description: string
        content?: {
          "application/json": {
            schema: Type
          }
        }
      }
    }
  }
}

export interface OpenAPI {
  openapi: Version;
  info: Info;
  paths: Record<string, PathItem>;
}