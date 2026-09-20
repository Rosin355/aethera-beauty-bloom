import type { JsonSchema } from "./types.ts";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isRealDate = (value: string): boolean => {
  const m = DATE_RE.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
};

/**
 * Validate `value` against the schema subset we use. Returns `null` when valid, otherwise a short
 * Italian message naming the offending path (fed back to the model so it can correct the call).
 * No coercion: "5" is not a number. Objects are strict unless `additionalProperties: true`.
 */
export const validateSchema = (schema: JsonSchema, value: unknown, path = "args"): string | null => {
  if (schema.enum && !schema.enum.includes(value as never)) {
    return `${path}: valore non ammesso (atteso uno tra ${schema.enum.join(", ")})`;
  }

  switch (schema.type) {
    case "object": {
      if (!isPlainObject(value)) return `${path}: deve essere un oggetto`;
      const props = schema.properties ?? {};
      for (const key of schema.required ?? []) {
        if (!(key in value) || value[key] === undefined) return `${path}.${key}: campo obbligatorio`;
      }
      if (schema.additionalProperties !== true) {
        for (const key of Object.keys(value)) {
          if (!(key in props)) return `${path}.${key}: campo non previsto`;
        }
      }
      for (const [key, sub] of Object.entries(props)) {
        if (key in value && value[key] !== undefined) {
          const err = validateSchema(sub, value[key], `${path}.${key}`);
          if (err) return err;
        }
      }
      return null;
    }
    case "string": {
      if (typeof value !== "string") return `${path}: deve essere una stringa`;
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        return `${path}: troppo corto (minimo ${schema.minLength} caratteri)`;
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        return `${path}: troppo lungo (massimo ${schema.maxLength} caratteri)`;
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) return `${path}: formato non valido`;
      if (schema.format === "date" && !isRealDate(value)) return `${path}: data non valida (atteso YYYY-MM-DD)`;
      if (schema.format === "date-time" && (!DATETIME_RE.test(value) || Number.isNaN(Date.parse(value)))) {
        return `${path}: data/ora non valida (atteso ISO 8601 con fuso, es. 2026-09-21T15:00:00+02:00)`;
      }
      if (schema.format === "uuid" && !UUID_RE.test(value)) return `${path}: uuid non valido`;
      return null;
    }
    case "integer":
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return `${path}: deve essere un numero`;
      if (schema.type === "integer" && !Number.isInteger(value)) return `${path}: deve essere un intero`;
      if (schema.minimum !== undefined && value < schema.minimum) return `${path}: minimo ${schema.minimum}`;
      if (schema.maximum !== undefined && value > schema.maximum) return `${path}: massimo ${schema.maximum}`;
      return null;
    }
    case "boolean":
      return typeof value === "boolean" ? null : `${path}: deve essere true o false`;
    case "array": {
      if (!Array.isArray(value)) return `${path}: deve essere un elenco`;
      if (schema.maxItems !== undefined && value.length > schema.maxItems) {
        return `${path}: massimo ${schema.maxItems} elementi`;
      }
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const err = validateSchema(schema.items, value[i], `${path}[${i}]`);
          if (err) return err;
        }
      }
      return null;
    }
    default:
      return null;
  }
};
