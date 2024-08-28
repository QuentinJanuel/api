import { quotify } from "../utils";
import * as openapi from "../openapi";

type TInt = { type: "int" };
export const int: TInt = { type: "int" };
const intSchema = "S.Int";
const intOpenAPI: openapi.Type = { type: "integer" };

type TNumber = { type: "number" };
export const number: TNumber = { type: "number" };
const numberSchema = "S.Number";
const numberOpenAPI: openapi.Type = { type: "number" };

type TString = { type: "string" };
export const string: TString = { type: "string" };
const stringSchema = "S.String";
const stringOpenAPI: openapi.Type = { type: "string" };

type TUuid = { type: "uuid" };
export const uuid: TUuid = { type: "uuid" };
const uuidSchema = "S.UUID";
const uuidOpenAPI: openapi.Type = { type: "string", format: "uuid" };

type TEnum = { type: "enum"; values: string[] };
export const enum_ = (values: string[]): TEnum => ({ type: "enum", values });
const enumSchema = (e: TEnum) =>
  `S.Literal(${e.values.map(quotify).join(", ")})`;
const enumOpenAPI = (e: TEnum): openapi.Type => ({ type: "string", enum: e.values });

type TBool = { type: "bool" };
export const bool: TBool = { type: "bool" };
const boolSchema = "S.Boolean";
const boolOpenAPI: openapi.Type = { type: "boolean" };

type TFile = { type: "file" };
export const file: TFile = { type: "file" };
const fileSchema = "S.instanceOf(File)";
const fileOpenAPI: openapi.Type = { type: "string", format: "binary" };

type TLit = TInt | TNumber | TString | TUuid | TEnum | TBool | TFile;
const litSchema = (lit: TLit): string => {
  switch (lit.type) {
    case "int": return intSchema;
    case "number": return numberSchema;
    case "string": return stringSchema;
    case "uuid": return uuidSchema;
    case "enum": return enumSchema(lit);
    case "bool": return boolSchema;
    case "file": return fileSchema;
  }
}
const litOpenAPI = (lit: TLit): openapi.Type => {
  switch (lit.type) {
    case "int": return intOpenAPI;
    case "number": return numberOpenAPI;
    case "string": return stringOpenAPI;
    case "uuid": return uuidOpenAPI;
    case "enum": return enumOpenAPI(lit);
    case "bool": return boolOpenAPI;
    case "file": return fileOpenAPI;
  }
}

type TArray = { type: "array"; items: TValue, minItems?: number };
export const array = (items: TValue, config?: {
  minItems?: number,
}): TArray => ({
  type: "array",
  items,
  minItems: config?.minItems,
});
export const nonEmptyArray = (items: TValue) => array(items, { minItems: 1 });
const arraySchema = (a: TArray) => {
  const minItems = a.minItems ?? 0;
  const pipes = [
    ...(minItems > 0 ? [`S.minItems(${minItems})`] : []),
  ]
  const base = `S.Array(${schema(a.items)})`;
  if (pipes.length === 0)
    return base;
  return `${base}.pipe(${pipes.join(", ")})`;
}
const arrayOpenAPI = (a: TArray): openapi.Type =>
  ({
    type: "array",
    items: openAPI(a.items),
    minItems: a.minItems,
  });

type TObject = { type: "object"; properties: Record<string, TValue> };
export const object = (properties: Record<string, TValue>): TObject =>
  ({ type: "object", properties });
const objectSchema = (o: TObject) => {
  const props = Object.keys(o.properties)
    .map(key => `${quotify(key)}: ${schema(o.properties[key])}`)
    .join(", ");
  return `S.Struct({${props}})`;
}
const objectOpenAPI = (o: TObject): openapi.Type => ({
  type: "object",
  properties: Object.keys(
    o.properties
  ).reduce((acc, key) => ({
    ...acc,
    [key]: openAPI(o.properties[key]),
  }), {}),
  required: Object.keys(o.properties),
});

export type TValue = TLit | TArray | TObject;
export const schema = (value: TValue): string => {
  switch (value.type) {
    case "array": return arraySchema(value);
    case "object": return objectSchema(value);
    default: return litSchema(value);
  }
}
export const openAPI = (value: TValue): openapi.Type => {
  switch (value.type) {
    case "array": return arrayOpenAPI(value);
    case "object": return objectOpenAPI(value);
    default: return litOpenAPI(value);
  }
}
