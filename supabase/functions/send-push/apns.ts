// APNs HTTP/2 provider client, token-based auth (RFC 8032 ES256 JWT), no third-party dependency:
// Deno's Web Crypto API signs the JWT, and Deno's fetch negotiates HTTP/2 over TLS automatically
// (api.push.apple.com offers it via ALPN) -- no separate HTTP/2 library is needed.
//
// UNVERIFIED: there is no Apple developer account, .p8 key or physical device reachable from this
// sandbox to test against. This follows Apple's documented provider-token format exactly (see
// developer.apple.com/documentation/usernotifications/establishing-a-token-based-connection-to-apns)
// but has not been exercised against a real APNs sandbox/production endpoint. Test with a real
// device token before trusting it — flagged again in docs/SECURITY_REVIEW_FASE1.md.

export interface ApnsConfig {
  teamId: string;
  keyId: string;
  /** PKCS8 PEM contents of the .p8 key, `-----BEGIN PRIVATE KEY-----` and all. */
  privateKeyPem: string;
  bundleId: string;
  environment: "sandbox" | "production";
}

export const apnsConfigFromEnv = (): ApnsConfig | null => {
  const teamId = Deno.env.get("APNS_TEAM_ID");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const rawKey = Deno.env.get("APNS_PRIVATE_KEY");
  const bundleId = Deno.env.get("APNS_BUNDLE_ID");
  if (!teamId || !keyId || !rawKey || !bundleId) return null;
  return {
    teamId,
    keyId,
    // Secrets stores sometimes only allow single-line values: accept an escaped \n too.
    privateKeyPem: rawKey.includes("\\n") ? rawKey.replace(/\\n/g, "\n") : rawKey,
    bundleId,
    environment: Deno.env.get("APNS_ENVIRONMENT") === "sandbox" ? "sandbox" : "production",
  };
};

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

// Uint8Array<ArrayBuffer>, not a bare Uint8Array: importKey's BufferSource excludes
// SharedArrayBuffer-backed views, which is what the unparameterised type widens to.
const pemToDer = (pem: string): Uint8Array<ArrayBuffer> => {
  const base64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

/**
 * The ES256 provider JWT APNs wants as the Authorization bearer. Apple recommends reusing one
 * for up to ~55 minutes, but each edge function invocation is a fresh cold start with no
 * reliable place to cache it, so a new token is generated every call — simpler and always
 * correct, at the cost of one extra signing operation per push.
 */
export const signApnsJwt = async (config: ApnsConfig): Promise<string> => {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(config.privateKeyPem),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );

  const header = { alg: "ES256", kid: config.keyId };
  const payload = { iss: config.teamId, iat: Math.floor(Date.now() / 1000) };
  const encoder = new TextEncoder();
  const signingInput = `${base64UrlEncode(encoder.encode(JSON.stringify(header)))}.${
    base64UrlEncode(encoder.encode(JSON.stringify(payload)))
  }`;

  // WebCrypto's ECDSA signature is the raw (r || s) concatenation JOSE/JWT expects, not DER —
  // no format conversion needed, unlike most other ECDSA APIs.
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, encoder.encode(signingInput));
  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
};

export interface ApnsResult {
  ok: boolean;
  status: number;
  /** Apple's `reason` field (e.g. "BadDeviceToken", "Unregistered") when ok is false. */
  reason?: string;
}

/** One push to one device token. `jwt` is reused across a batch by the caller (signApnsJwt once). */
export const sendApnsPush = async (
  config: ApnsConfig,
  jwt: string,
  deviceToken: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {},
): Promise<ApnsResult> => {
  const host = config.environment === "sandbox" ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const response = await fetch(`https://${host}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
    },
    body: JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...data }),
  });

  if (response.ok) return { ok: true, status: response.status };

  let reason: string | undefined;
  try {
    const json = await response.json();
    reason = typeof json?.reason === "string" ? json.reason : undefined;
  } catch {
    // no JSON body; leave reason undefined
  }
  return { ok: false, status: response.status, reason };
};

/** Apple's signal that this token will never work again — safe to delete, not just log. */
export const isTerminalApnsFailure = (result: ApnsResult): boolean =>
  result.status === 410 || result.reason === "BadDeviceToken" || result.reason === "Unregistered";
