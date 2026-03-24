import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

export type SiteSettingRow = Database["public"]["Tables"]["site_settings"]["Row"];
export type SiteSectionRow = Database["public"]["Tables"]["site_sections"]["Row"];
export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type LegalLinkRow = Database["public"]["Tables"]["legal_links"]["Row"];

const isJsonObject = (value: Json | null | undefined): value is Record<string, Json> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const isJsonArray = (value: Json | null | undefined): value is Json[] => {
  return Array.isArray(value);
};

export const readSectionExtraObject = <T extends Record<string, unknown>>(
  section: Pick<SiteSectionRow, "extra"> | null,
  fallback: T,
): T => {
  if (!section || !isJsonObject(section.extra)) {
    return fallback;
  }

  return section.extra as unknown as T;
};

export const readSectionExtraArray = <T>(
  section: Pick<SiteSectionRow, "extra"> | null,
  key: string,
  fallback: T[],
): T[] => {
  if (!section || !isJsonObject(section.extra)) {
    return fallback;
  }

  const value = section.extra[key];
  if (!isJsonArray(value)) {
    return fallback;
  }

  return value as unknown as T[];
};

export const getSiteSections = async (
  keys: string[],
): Promise<Record<string, SiteSectionRow>> => {
  try {
    const { data, error } = await supabase
      .from("site_sections")
      .select("*")
      .in("section_key", keys)
      .eq("is_active", true);

    if (error) {
      console.error("Errore fetch site_sections:", error.message);
      return {};
    }

    return (data ?? []).reduce<Record<string, SiteSectionRow>>((acc, section) => {
      acc[section.section_key] = section;
      return acc;
    }, {});
  } catch (error) {
    console.error("Errore inatteso fetch site_sections");
    return {};
  }
};

export const getSiteSection = async (key: string): Promise<SiteSectionRow | null> => {
  const sections = await getSiteSections([key]);
  return sections[key] ?? null;
};

export const getSiteSettings = async (): Promise<Record<string, SiteSettingRow>> => {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .eq("is_public", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Errore fetch site_settings:", error.message);
      return {};
    }

    return (data ?? []).reduce<Record<string, SiteSettingRow>>((acc, setting) => {
      acc[setting.setting_key] = setting;
      return acc;
    }, {});
  } catch {
    console.error("Errore inatteso fetch site_settings");
    return {};
  }
};

export const getTestimonials = async (): Promise<TestimonialRow[]> => {
  try {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Errore fetch testimonials:", error.message);
      return [];
    }

    return data ?? [];
  } catch {
    console.error("Errore inatteso fetch testimonials");
    return [];
  }
};

export const getLegalLinks = async (location: string): Promise<LegalLinkRow[]> => {
  try {
    const { data, error } = await supabase
      .from("legal_links")
      .select("*")
      .eq("location", location)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Errore fetch legal_links:", error.message);
      return [];
    }

    return data ?? [];
  } catch {
    console.error("Errore inatteso fetch legal_links");
    return [];
  }
};
