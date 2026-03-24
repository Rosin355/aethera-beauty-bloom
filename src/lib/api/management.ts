import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type ServiceRow = Database["public"]["Tables"]["business_services"]["Row"];
type InventoryRow = Database["public"]["Tables"]["inventory_items"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["business_appointments"]["Row"];

export type BusinessService = ServiceRow;
export type InventoryItem = InventoryRow;
export type BusinessAppointment = AppointmentRow;

export type OverviewKpis = {
  totalBookings: number;
  revenue: number;
  productsTracked: number;
  avgServiceValue: number;
};

export type OverviewSeries = {
  weeklyBookings: Array<{ name: string; bookings: number }>;
  productUsage: Array<{ name: string; value: number }>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
};

const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];

const getCurrentUserId = async (): Promise<string> => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Utente non autenticato");
  }
  return data.user.id;
};

export const fetchBusinessServices = async (): Promise<BusinessService[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("business_services")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createBusinessService = async (payload: {
  name: string;
  category: string;
  duration_minutes: number;
  price: number;
  description: string;
}): Promise<BusinessService> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("business_services")
    .insert({ ...payload, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const fetchInventoryItems = async (): Promise<InventoryItem[]> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("user_id", userId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
};

export const createInventoryItem = async (payload: {
  name: string;
  category: string;
  quantity: number;
  supplier: string;
  price: number;
}): Promise<InventoryItem> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({ ...payload, user_id: userId })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("inventory_items")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
};

export const fetchAppointmentsByDate = async (date: Date): Promise<BusinessAppointment[]> => {
  const userId = await getCurrentUserId();
  const from = new Date(date);
  from.setHours(0, 0, 0, 0);
  const to = new Date(date);
  to.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("business_appointments")
    .select("*")
    .eq("user_id", userId)
    .gte("appointment_at", from.toISOString())
    .lte("appointment_at", to.toISOString())
    .order("appointment_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const createAppointment = async (payload: {
  client_name: string;
  service_id?: string | null;
  service_name: string;
  appointment_at: string;
  duration_minutes?: number;
  price?: number;
}): Promise<BusinessAppointment> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("business_appointments")
    .insert({
      user_id: userId,
      client_name: payload.client_name,
      service_id: payload.service_id ?? null,
      service_name: payload.service_name,
      appointment_at: payload.appointment_at,
      duration_minutes: payload.duration_minutes ?? 60,
      price: payload.price ?? 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

export const fetchOverviewData = async (): Promise<{ kpis: OverviewKpis; series: OverviewSeries }> => {
  const userId = await getCurrentUserId();

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const [appointmentsRes, inventoryRes] = await Promise.all([
    supabase
      .from("business_appointments")
      .select("appointment_at, service_name, price")
      .eq("user_id", userId)
      .gte("appointment_at", weekStart.toISOString()),
    supabase
      .from("inventory_items")
      .select("category")
      .eq("user_id", userId)
      .eq("is_archived", false),
  ]);

  if (appointmentsRes.error) throw appointmentsRes.error;
  if (inventoryRes.error) throw inventoryRes.error;

  const appointments = appointmentsRes.data ?? [];
  const inventory = inventoryRes.data ?? [];

  const weeklyMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    weeklyMap.set(dayNames[d.getDay()], 0);
  }

  const serviceMap = new Map<string, { count: number; revenue: number }>();
  let totalRevenue = 0;
  appointments.forEach((a) => {
    const date = new Date(a.appointment_at);
    const dayName = dayNames[date.getDay()];
    weeklyMap.set(dayName, (weeklyMap.get(dayName) ?? 0) + 1);
    const current = serviceMap.get(a.service_name) ?? { count: 0, revenue: 0 };
    current.count += 1;
    current.revenue += Number(a.price ?? 0);
    serviceMap.set(a.service_name, current);
    totalRevenue += Number(a.price ?? 0);
  });

  const inventoryCategoryMap = new Map<string, number>();
  inventory.forEach((item) => {
    const category = item.category || "Altro";
    inventoryCategoryMap.set(category, (inventoryCategoryMap.get(category) ?? 0) + 1);
  });

  const topServices = Array.from(serviceMap.entries())
    .map(([name, values]) => ({ name, count: values.count, revenue: values.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const kpis: OverviewKpis = {
    totalBookings: appointments.length,
    revenue: totalRevenue,
    productsTracked: inventory.length,
    avgServiceValue: appointments.length > 0 ? totalRevenue / appointments.length : 0,
  };

  const series: OverviewSeries = {
    weeklyBookings: Array.from(weeklyMap.entries()).map(([name, bookings]) => ({ name, bookings })),
    productUsage: Array.from(inventoryCategoryMap.entries()).map(([name, value]) => ({ name, value })),
    topServices,
  };

  return { kpis, series };
};
