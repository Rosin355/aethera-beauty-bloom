import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { validateSchema } from "./schema.ts";
import type { JsonSchema } from "./types.ts";

const objectSchema: JsonSchema = {
  type: "object",
  properties: {
    name: { type: "string", minLength: 2, maxLength: 5 },
    amount: { type: "number", minimum: 1, maximum: 100 },
    count: { type: "integer" },
    day: { type: "string", format: "date" },
    when: { type: "string", format: "date-time" },
    id: { type: "string", format: "uuid" },
    kind: { type: "string", enum: ["a", "b"] },
    flag: { type: "boolean" },
    tags: { type: "array", items: { type: "string" }, maxItems: 2 },
  },
  required: ["name"],
  additionalProperties: false,
};

Deno.test("accepts a valid object", () => {
  assertEquals(
    validateSchema(objectSchema, {
      name: "abc", amount: 5.5, count: 2, day: "2026-09-16", when: "2026-09-16T10:00:00+02:00",
      id: "aaaaaaaa-0000-4000-8000-000000000001", kind: "a", flag: false, tags: ["x"],
    }),
    null,
  );
});

Deno.test("rejects unknown properties by default (e.g. an injected center_id)", () => {
  const err = validateSchema(objectSchema, { name: "abc", center_id: "x" });
  assertStringIncludes(err ?? "", "center_id");
});

Deno.test("additionalProperties:true is opt-in", () => {
  assertEquals(validateSchema({ type: "object", additionalProperties: true }, { anything: 1 }), null);
});

Deno.test("required, types and no coercion", () => {
  assertStringIncludes(validateSchema(objectSchema, {}) ?? "", "obbligatorio");
  assertStringIncludes(validateSchema(objectSchema, { name: 5 }) ?? "", "stringa");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", amount: "5" }) ?? "", "numero");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", amount: NaN }) ?? "", "numero");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", count: 1.5 }) ?? "", "intero");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", flag: "true" }) ?? "", "true o false");
  assertStringIncludes(validateSchema(objectSchema, null) ?? "", "oggetto");
  assertStringIncludes(validateSchema(objectSchema, []) ?? "", "oggetto");
});

Deno.test("bounds", () => {
  assertStringIncludes(validateSchema(objectSchema, { name: "a" }) ?? "", "corto");
  assertStringIncludes(validateSchema(objectSchema, { name: "abcdef" }) ?? "", "lungo");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", amount: 0 }) ?? "", "minimo");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", amount: 101 }) ?? "", "massimo");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", kind: "z" }) ?? "", "non ammesso");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", tags: ["a", "b", "c"] }) ?? "", "massimo 2");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", tags: [1] }) ?? "", "tags[0]");
});

Deno.test("formats", () => {
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", day: "2026-02-30" }) ?? "", "data non valida");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", day: "16/09/2026" }) ?? "", "data non valida");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", when: "2026-09-16T10:00:00" }) ?? "", "fuso");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", when: "domani" }) ?? "", "fuso");
  assertStringIncludes(validateSchema(objectSchema, { name: "abc", id: "not-a-uuid" }) ?? "", "uuid");
  assertEquals(validateSchema(objectSchema, { name: "abc", when: "2026-09-16T10:00Z" }), null);
});
