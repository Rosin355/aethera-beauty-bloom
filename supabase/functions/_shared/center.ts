import { HttpError, type UserClient } from "./auth.ts";

export type CenterRole = "owner" | "operator" | "receptionist";

export interface CenterAccess {
  centerId: string;
  role: CenterRole;
  centerName: string | null;
  /** IANA time zone of the center (defaults to Europe/Rome if unreadable). */
  timezone: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: readonly string[] = ["owner", "operator", "receptionist"];

interface CenterRel {
  name?: string | null;
  timezone?: string | null;
}

interface MembershipRow {
  center_id: string;
  role: string;
  centers?: CenterRel | CenterRel[] | null;
}

/**
 * Resolve which center the caller is acting on, using the caller's OWN client so RLS decides what
 * memberships are visible. `requestedCenterId` (from the request body) is only ever a *selector*:
 * it must match one of the caller's active memberships, otherwise 403.
 *
 * Returns null when the user has no active center at all (callers then run without center tools).
 * Throws 400 when several centers exist and none was requested, 403 when the requested one is not theirs.
 */
export const resolveCenterAccess = async (
  userClient: UserClient,
  userId: string,
  requestedCenterId: unknown,
): Promise<CenterAccess | null> => {
  if (requestedCenterId !== undefined && requestedCenterId !== null) {
    if (typeof requestedCenterId !== "string" || !UUID_RE.test(requestedCenterId)) {
      throw new HttpError(400, "centerId non valido");
    }
  }

  const { data, error } = await userClient
    .from("center_members")
    .select("center_id, role, centers(name, timezone)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) {
    throw new HttpError(500, "Errore verifica appartenenza al centro");
  }

  const rows = ((data ?? []) as MembershipRow[]).filter(
    (row) => typeof row.center_id === "string" && ROLES.includes(row.role),
  );

  let chosen: MembershipRow | undefined;
  if (typeof requestedCenterId === "string") {
    chosen = rows.find((row) => row.center_id.toLowerCase() === requestedCenterId.toLowerCase());
    if (!chosen) {
      throw new HttpError(403, "Non hai accesso a questo centro");
    }
  } else if (rows.length === 1) {
    chosen = rows[0];
  } else if (rows.length > 1) {
    throw new HttpError(400, "centerId richiesto");
  } else {
    return null;
  }

  const centerRel = Array.isArray(chosen.centers) ? chosen.centers[0] : chosen.centers;
  return {
    centerId: chosen.center_id,
    role: chosen.role as CenterRole,
    centerName: centerRel?.name ?? null,
    timezone: centerRel?.timezone || "Europe/Rome",
  };
};
