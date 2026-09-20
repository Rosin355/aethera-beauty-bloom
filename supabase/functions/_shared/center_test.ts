import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { UserClient } from "./auth.ts";
import { HttpError } from "./auth.ts";
import { resolveCenterAccess } from "./center.ts";

const A = "aaaaaaaa-0000-4000-8000-000000000001";
const B = "aaaaaaaa-0000-4000-8000-000000000002";

const clientReturning = (data: unknown, error: { message: string } | null = null) => {
  const filters: [string, unknown][] = [];
  const chain = {
    select: () => chain,
    eq: (col: string, val: unknown) => {
      filters.push([col, val]);
      return chain;
    },
    then: (ok: (v: unknown) => unknown, err: (e: unknown) => unknown) => Promise.resolve({ data, error }).then(ok, err),
  };
  return { client: { from: () => chain } as unknown as UserClient, filters };
};

Deno.test("single membership is used when no centerId is sent", async () => {
  const { client, filters } = clientReturning([{ center_id: A, role: "owner", centers: { name: "Aurora", timezone: "Europe/Rome" } }]);
  assertEquals(await resolveCenterAccess(client, "u1", undefined), { centerId: A, role: "owner", centerName: "Aurora", timezone: "Europe/Rome" });
  assertEquals(filters, [["user_id", "u1"], ["status", "active"]]);
});

Deno.test("embedded center as array, missing timezone defaults to Europe/Rome", async () => {
  const { client } = clientReturning([{ center_id: A, role: "operator", centers: [{ name: "X" }] }]);
  const access = await resolveCenterAccess(client, "u1", null);
  assertEquals(access?.timezone, "Europe/Rome");
  assertEquals(access?.centerName, "X");
});

Deno.test("no membership → null (tools disabled)", async () => {
  assertEquals(await resolveCenterAccess(clientReturning([]).client, "u1", undefined), null);
});

Deno.test("several memberships need an explicit centerId; a foreign centerId is 403", async () => {
  const rows = [{ center_id: A, role: "owner", centers: null }, { center_id: B, role: "operator", centers: null }];
  const { client } = clientReturning(rows);
  const err = await assertRejects(() => resolveCenterAccess(client, "u1", undefined), HttpError);
  assertEquals(err.status, 400);

  assertEquals((await resolveCenterAccess(client, "u1", B))?.role, "operator");
  assertEquals((await resolveCenterAccess(client, "u1", B.toUpperCase()))?.centerId, B);

  const other = "aaaaaaaa-0000-4000-8000-0000000000ff";
  const forbidden = await assertRejects(() => resolveCenterAccess(client, "u1", other), HttpError);
  assertEquals(forbidden.status, 403);
  // even with a single membership, asking for someone else's center is refused (not silently downgraded)
  const single = await assertRejects(() => resolveCenterAccess(clientReturning([rows[0]]).client, "u1", other), HttpError);
  assertEquals(single.status, 403);
});

Deno.test("malformed centerId is 400; unknown roles are ignored; DB errors are 500", async () => {
  const { client } = clientReturning([{ center_id: A, role: "owner", centers: null }]);
  for (const bad of ["x", 5, {}, "aaaaaaaa-0000-4000-8000-00000000000g"]) {
    const e = await assertRejects(() => resolveCenterAccess(client, "u1", bad), HttpError);
    assertEquals(e.status, 400);
  }
  assertEquals(await resolveCenterAccess(clientReturning([{ center_id: A, role: "admin", centers: null }]).client, "u1", undefined), null);
  const e500 = await assertRejects(() => resolveCenterAccess(clientReturning(null, { message: "x" }).client, "u1", undefined), HttpError);
  assertEquals(e500.status, 500);
});
