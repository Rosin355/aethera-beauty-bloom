import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClientMetricRow = Database["public"]["Tables"]["client_metrics"]["Row"];
type ClientNoteRow = Database["public"]["Tables"]["client_notes"]["Row"];
type AdminContentRow = Database["public"]["Tables"]["admin_content_items"]["Row"];

export type ClientProfileSummary = {
  user_id: string;
  display_name: string;
  email: string | null;
  business_name: string | null;
  created_at: string;
};

export type ClientDetailSummary = {
  profile: ClientProfileSummary | null;
  latestMetric: ClientMetricRow | null;
};

export type ClientNoteView = ClientNoteRow;
export type AdminContentView = AdminContentRow;

const safeArray = <T>(value: Json): T[] => {
  return Array.isArray(value) ? (value as unknown as T[]) : [];
};

export const fetchClientDetailSummary = async (clientUserId: string): Promise<ClientDetailSummary> => {
  const [profileRes, metricRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, display_name, email, business_name, created_at")
      .eq("user_id", clientUserId)
      .maybeSingle(),
    supabase
      .from("client_metrics")
      .select("*")
      .eq("client_user_id", clientUserId)
      .order("metric_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (metricRes.error) throw metricRes.error;

  return {
    profile: profileRes.data,
    latestMetric: metricRes.data,
  };
};

export const fetchClientMetricsHistory = async (clientUserId: string): Promise<ClientMetricRow[]> => {
  const { data, error } = await supabase
    .from("client_metrics")
    .select("*")
    .eq("client_user_id", clientUserId)
    .order("metric_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const fetchClientNotes = async (clientUserId: string): Promise<ClientNoteView[]> => {
  const { data, error } = await supabase
    .from("client_notes")
    .select("*")
    .eq("client_user_id", clientUserId)
    .order("note_date", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createClientNote = async (payload: {
  client_user_id: string;
  note_text: string;
  note_date: string;
  category: string;
}): Promise<ClientNoteView> => {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;

  let createdByName = user?.email ?? "Admin";
  if (user?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle();
    createdByName = profile?.display_name || createdByName;
  }

  const { data, error } = await supabase
    .from("client_notes")
    .insert({
      ...payload,
      created_by: user?.id ?? null,
      created_by_name: createdByName,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const fetchAdminContentItems = async (): Promise<AdminContentView[]> => {
  const { data, error } = await supabase
    .from("admin_content_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createAdminContentItem = async (payload: {
  title: string;
  content_type: string;
  category: string;
  visibility: string;
  duration?: string | null;
  file_url?: string | null;
}): Promise<AdminContentView> => {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("admin_content_items")
    .insert({
      ...payload,
      created_by: authData.user?.id ?? null,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const deleteAdminContentItem = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("admin_content_items")
    .delete()
    .eq("id", id);
  if (error) throw error;
};

export const buildClientOverviewData = (metrics: ClientMetricRow[]) => {
  const sorted = [...metrics].sort((a, b) => a.metric_date.localeCompare(b.metric_date));
  const latest = sorted[sorted.length - 1] ?? null;

  const revenueTrend = sorted.map((item) => ({
    month: new Date(item.metric_date).toLocaleDateString("it-IT", { month: "short" }),
    revenue: Number(item.revenue ?? 0),
    clients: item.active_clients ?? 0,
    services: item.services_count ?? 0,
    bookings: item.bookings_count ?? 0,
  }));

  const serviceDistribution = latest ? safeArray<{ name: string; value: number }>(latest.service_distribution) : [];
  const topServices = latest ? safeArray<{ name: string; count: number; revenue: number }>(latest.top_services) : [];
  const trainingProgress = latest ? safeArray<{ name: string; value: number }>(latest.training_progress) : [];

  return { latest, revenueTrend, serviceDistribution, topServices, trainingProgress };
};
