import { quotify } from "../utils";
import * as openapi from "../openapi";

type TInt = { type: "int" };
export const int: TInt = { type: "int" };
const intSchema = "S.Int";
const intOpenAPI: openapi.Type = { type: "integer" };
const intDefault = "0";

type TNumber = { type: "number" };
export const number: TNumber = { type: "number" };
const numberSchema = "S.Number";
const numberOpenAPI: openapi.Type = { type: "number" };
const numberDefault = "0";

type TString = { type: "string" };
export const string: TString = { type: "string" };
const stringSchema = "S.String";
const stringOpenAPI: openapi.Type = { type: "string" };
const stringDefault = quotify("string");

type TUuid = { type: "uuid" };
export const uuid: TUuid = { type: "uuid" };
const uuidSchema = "S.UUID";
const uuidOpenAPI: openapi.Type = { type: "string", format: "uuid" };
const uuidDefault = quotify("550e8400-e29b-41d4-a716-446655440000");

type TEnum = { type: "enum"; values: string[] };
export const enum_ = (values: string[]): TEnum => ({ type: "enum", values });
const enumSchema = (e: TEnum) =>
  `S.Literal(${e.values.map(quotify).join(", ")})`;
const enumOpenAPI = (e: TEnum): openapi.Type => ({ type: "string", enum: e.values });
const enumDefault = (e: TEnum) => quotify(e.values[0]);

type TBool = { type: "bool" };
export const bool: TBool = { type: "bool" };
const boolSchema = "S.Boolean";
const boolOpenAPI: openapi.Type = { type: "boolean" };
const boolDefault = "false";

type TFile = { type: "file" };
export const file: TFile = { type: "file" };
const fileSchema = "S.instanceOf(File)";
const fileOpenAPI: openapi.Type = { type: "string", format: "binary" };
const fileDefault = `new File([], "filename")`

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
const litDefault = (lit: TLit): string => {
  switch (lit.type) {
    case "int": return intDefault;
    case "number": return numberDefault;
    case "string": return stringDefault;
    case "uuid": return uuidDefault;
    case "enum": return enumDefault(lit);
    case "bool": return boolDefault;
    case "file": return fileDefault;
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
const arrayDefault = (a: TArray): string => {
  const item = defaultValue(a.items);
  const minItems = a.minItems ?? 0;
  return `Array.from({ length: ${minItems + 1} }).map(() => (${item}))`;
}

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
const objectDefault = (o: TObject): string => {
  const props = Object.keys(o.properties)
    .map(key => `${key}: ${defaultValue(o.properties[key])}`)
    .join(", ");
  return `{${props}}`;
}

export type TValue = TLit | TArray | TObject;
export const schema = (value?: TValue): string => {
  if (!value) return "S.Struct({})";
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
export const defaultValue = (value: TValue): string => {
  switch (value.type) {
    case "array": return arrayDefault(value);
    case "object": return objectDefault(value);
    default: return litDefault(value);
  }
}
