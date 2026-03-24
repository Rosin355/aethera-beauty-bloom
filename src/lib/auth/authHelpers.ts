import { supabase } from "@/integrations/supabase/client";

export interface RoleFlags {
  isAdmin: boolean;
  isCollaborator: boolean;
}

const EMPTY_ROLE_FLAGS: RoleFlags = {
  isAdmin: false,
  isCollaborator: false,
};

export const fetchUserRoleFlags = async (userId: string): Promise<RoleFlags> => {
  try {
    const { data: roles, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (error) {
      console.error("Error checking user roles:", error);
      return EMPTY_ROLE_FLAGS;
    }

    const userRoles = roles?.map((roleEntry) => roleEntry.role) ?? [];
    const isAdmin = userRoles.includes("admin");

    return {
      isAdmin,
      // Gli admin sono sempre trattati come collaboratori per coerenza sui guard.
      isCollaborator: isAdmin || userRoles.includes("collaborator"),
    };
  } catch (error) {
    console.error("Error resolving role flags:", error);
    return EMPTY_ROLE_FLAGS;
  }
};

export const logSecurityAuditEvent = async (
  userId: string,
  action: string,
  resource: string
) => {
  try {
    await supabase.from("security_audit_log").insert({
      user_id: userId,
      action,
      resource,
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
};

