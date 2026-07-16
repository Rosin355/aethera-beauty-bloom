import { supabase } from "@/integrations/supabase/client";

export type CenterRole = "owner" | "operator" | "receptionist";

export interface CenterMemberRow {
  id: string;
  user_id: string | null;
  invited_email: string | null;
  role: CenterRole;
  status: "invited" | "active";
  created_at: string;
}

/**
 * Resolve the current user's active center, creating it (owner membership) on first use.
 * Idempotent: returns the existing center if the user already belongs to one.
 */
export const ensureCenterForUser = async (defaultName?: string): Promise<string | null> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return null;

  const { data: existing } = await supabase
    .from("center_members")
    .select("center_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.center_id) return existing.center_id;

  let name = defaultName?.trim();
  if (!name) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("user_id", user.id)
      .maybeSingle();
    const label = profile?.display_name?.trim() || profile?.email?.trim() || user.email || "senza nome";
    name = `Centro di ${label}`;
  }

  const { data: center, error } = await supabase
    .from("centers")
    .insert({ name, owner_user_id: user.id })
    .select("id")
    .single();
  if (error || !center) throw error ?? new Error("Impossibile creare il centro");

  const { error: memberError } = await supabase
    .from("center_members")
    .insert({ center_id: center.id, user_id: user.id, role: "owner", status: "active" });
  if (memberError) throw memberError;

  return center.id;
};

/** Claim any pending invite whose email matches the current user; bind user_id + activate. */
export const bindPendingInvites = async (): Promise<void> => {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) return;

  const { data: invites } = await supabase
    .from("center_members")
    .select("id")
    .is("user_id", null)
    .eq("status", "invited")
    .ilike("invited_email", user.email);

  for (const invite of invites ?? []) {
    await supabase
      .from("center_members")
      .update({ user_id: user.id, status: "active" })
      .eq("id", invite.id);
  }
};

export const fetchCenterMembers = async (centerId: string): Promise<CenterMemberRow[]> => {
  const { data, error } = await supabase
    .from("center_members")
    .select("id, user_id, invited_email, role, status, created_at")
    .eq("center_id", centerId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CenterMemberRow[];
};

export const inviteCenterMember = async (
  centerId: string,
  email: string,
  role: Exclude<CenterRole, "owner">,
): Promise<void> => {
  const cleanEmail = email.trim().toLowerCase();
  const { error } = await supabase
    .from("center_members")
    .insert({ center_id: centerId, invited_email: cleanEmail, role, status: "invited" });
  if (error) throw error;

  // Best-effort invite email via the authenticated, owner-checked edge function.
  try {
    await supabase.functions.invoke("send-center-invite", {
      body: { center_id: centerId, email: cleanEmail },
    });
  } catch (emailError) {
    console.error("Invio email di invito non riuscito:", emailError);
  }
};

export const removeCenterMember = async (memberId: string): Promise<void> => {
  const { error } = await supabase.from("center_members").delete().eq("id", memberId);
  if (error) throw error;
};
