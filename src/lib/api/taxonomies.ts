import { supabase } from "@/integrations/supabase/client";

export type CategoryKind = "service" | "inventory";

export interface CategoryRow {
  id: string;
  center_id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

const DEFAULT_DURATIONS = [30, 45, 60, 75, 90, 120];

const tableFor = (kind: CategoryKind): "service_categories" | "inventory_categories" =>
  kind === "service" ? "service_categories" : "inventory_categories";

export const fetchCategories = async (
  kind: CategoryKind,
  centerId: string,
  opts: { activeOnly?: boolean } = {},
): Promise<CategoryRow[]> => {
  let query = supabase
    .from(tableFor(kind))
    .select("id, center_id, name, sort_order, active")
    .eq("center_id", centerId);
  if (opts.activeOnly) query = query.eq("active", true);

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CategoryRow[];
};

export const createCategory = async (
  kind: CategoryKind,
  centerId: string,
  name: string,
): Promise<CategoryRow> => {
  const existing = await fetchCategories(kind, centerId);
  const nextOrder = existing.reduce((max, c) => Math.max(max, c.sort_order), 0) + 1;

  const { data, error } = await supabase
    .from(tableFor(kind))
    .insert({ center_id: centerId, name: name.trim(), sort_order: nextOrder })
    .select("id, center_id, name, sort_order, active")
    .single();
  if (error) throw error;
  return data as CategoryRow;
};

export const renameCategory = async (kind: CategoryKind, id: string, name: string): Promise<void> => {
  const { error } = await supabase.from(tableFor(kind)).update({ name: name.trim() }).eq("id", id);
  if (error) throw error;
};

/** Soft deactivate/reactivate: historical rows referencing the name stay valid. */
export const setCategoryActive = async (kind: CategoryKind, id: string, active: boolean): Promise<void> => {
  const { error } = await supabase.from(tableFor(kind)).update({ active }).eq("id", id);
  if (error) throw error;
};

export const reorderCategory = async (kind: CategoryKind, id: string, sortOrder: number): Promise<void> => {
  const { error } = await supabase.from(tableFor(kind)).update({ sort_order: sortOrder }).eq("id", id);
  if (error) throw error;
};

export const fetchCenterDurations = async (centerId: string): Promise<number[]> => {
  const { data, error } = await supabase
    .from("centers")
    .select("service_durations")
    .eq("id", centerId)
    .maybeSingle();
  if (error) throw error;
  const durations = data?.service_durations;
  return durations && durations.length > 0 ? durations : DEFAULT_DURATIONS;
};

/** "60" -> "1 h", "90" -> "1 h 30 min", "45" -> "45 min". */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};
