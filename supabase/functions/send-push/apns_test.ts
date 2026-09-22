import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { apnsConfigFromEnv, isTerminalApnsFailure, signApnsJwt, type ApnsConfig } from "./apns.ts";

// signApnsJwt cannot be checked against a real Apple .p8 key (none reachable from this sandbox),
// but the JWT it produces CAN be verified for real: generate a throwaway ECDSA P-256 key pair,
// export the private half to the same PKCS8 PEM shape a real .p8 file has, sign with it, and
// verify the result is a well-formed JWT whose signature actually checks out against the public
// key. That derisks the one part of send-push this sandbox can meaningfully test.

const toPem = (der: ArrayBuffer): string => {
  const bytes = new Uint8Array(der);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const base64 = btoa(binary);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
};

const base64UrlDecode = (value: string): Uint8Array => {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(value.length + (4 - value.length % 4) % 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const makeTestConfig = async (): Promise<{ config: ApnsConfig; publicKey: CryptoKey }> => {
  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  return {
    config: {
      teamId: "TEAMID1234",
      keyId: "KEYID12345",
      privateKeyPem: toPem(pkcs8),
      bundleId: "it.4elementi.concierge",
      environment: "sandbox",
    },
    publicKey: pair.publicKey,
  };
};

Deno.test("signApnsJwt: three base64url segments, correct header and payload claims", async () => {
  const { config } = await makeTestConfig();
  const jwt = await signApnsJwt(config);
  const parts = jwt.split(".");
  assertEquals(parts.length, 3);

  const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
  assertEquals(header, { alg: "ES256", kid: "KEYID12345" });

  const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
  assertEquals(payload.iss, "TEAMID1234");
  assertEquals(typeof payload.iat, "number");
  assertEquals(Math.abs(payload.iat - Math.floor(Date.now() / 1000)) < 5, true);
});

Deno.test("signApnsJwt: the signature actually verifies against the matching public key", async () => {
  const { config, publicKey } = await makeTestConfig();
  const jwt = await signApnsJwt(config);
  const [headerB64, payloadB64, signatureB64] = jwt.split(".");

  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    publicKey,
    base64UrlDecode(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  assertEquals(valid, true);
});

Deno.test("signApnsJwt: a wrong key's signature does NOT verify (sanity check on the check above)", async () => {
  const { config } = await makeTestConfig();
  const { publicKey: otherPublicKey } = await makeTestConfig();
  const jwt = await signApnsJwt(config);
  const [headerB64, payloadB64, signatureB64] = jwt.split(".");

  const valid = await crypto.subtle.verify(
    { name: "ECDSA", hash: "SHA-256" },
    otherPublicKey,
    base64UrlDecode(signatureB64),
    new TextEncoder().encode(`${headerB64}.${payloadB64}`),
  );
  assertEquals(valid, false);
});

Deno.test("apnsConfigFromEnv: null when any of the four required vars is missing", () => {
  const keys = ["APNS_TEAM_ID", "APNS_KEY_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID", "APNS_ENVIRONMENT"];
  const saved = Object.fromEntries(keys.map((k) => [k, Deno.env.get(k)]));
  try {
    for (const k of keys) Deno.env.delete(k);
    assertEquals(apnsConfigFromEnv(), null);
    Deno.env.set("APNS_TEAM_ID", "TEAMID1234");
    Deno.env.set("APNS_KEY_ID", "KEYID12345");
    Deno.env.set("APNS_PRIVATE_KEY", "fake-key");
    assertEquals(apnsConfigFromEnv(), null); // still missing APNS_BUNDLE_ID
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) Deno.env.delete(k);
      else Deno.env.set(k, saved[k]!);
    }
  }
});

Deno.test("apnsConfigFromEnv: unescapes a literal \\n private key and defaults environment to production", () => {
  const keys = ["APNS_TEAM_ID", "APNS_KEY_ID", "APNS_PRIVATE_KEY", "APNS_BUNDLE_ID", "APNS_ENVIRONMENT"];
  const saved = Object.fromEntries(keys.map((k) => [k, Deno.env.get(k)]));
  try {
    Deno.env.set("APNS_TEAM_ID", "TEAMID1234");
    Deno.env.set("APNS_KEY_ID", "KEYID12345");
    Deno.env.set("APNS_PRIVATE_KEY", "-----BEGIN PRIVATE KEY-----\\nabc\\ndef\\n-----END PRIVATE KEY-----");
    Deno.env.set("APNS_BUNDLE_ID", "it.4elementi.concierge");
    Deno.env.delete("APNS_ENVIRONMENT");

    const config = apnsConfigFromEnv();
    assertEquals(config?.privateKeyPem, "-----BEGIN PRIVATE KEY-----\nabc\ndef\n-----END PRIVATE KEY-----");
    assertEquals(config?.environment, "production");

    Deno.env.set("APNS_ENVIRONMENT", "sandbox");
    assertEquals(apnsConfigFromEnv()?.environment, "sandbox");
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) Deno.env.delete(k);
      else Deno.env.set(k, saved[k]!);
    }
  }
});

Deno.test("isTerminalApnsFailure: 410 or a terminal reason means delete the token; other failures don't", () => {
  assertEquals(isTerminalApnsFailure({ ok: false, status: 410 }), true);
  assertEquals(isTerminalApnsFailure({ ok: false, status: 400, reason: "BadDeviceToken" }), true);
  assertEquals(isTerminalApnsFailure({ ok: false, status: 410, reason: "Unregistered" }), true);
  assertEquals(isTerminalApnsFailure({ ok: false, status: 400, reason: "BadPriority" }), false);
  assertEquals(isTerminalApnsFailure({ ok: false, status: 500 }), false);
});
