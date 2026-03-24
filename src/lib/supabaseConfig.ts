const getTrimmedEnv = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const envSupabaseUrl = getTrimmedEnv(import.meta.env.VITE_SUPABASE_URL);
const envSupabasePublishableKey = getTrimmedEnv(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const envSupabaseProjectId = getTrimmedEnv(import.meta.env.VITE_SUPABASE_PROJECT_ID);
const envAuthRedirectUrl = getTrimmedEnv(import.meta.env.VITE_AUTH_REDIRECT_URL);

const resolveProjectRefFromUrl = (supabaseUrl: string): string | undefined => {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    return hostname.split(".")[0];
  } catch {
    return undefined;
  }
};

const requireEnv = (value: string | undefined, envName: string): string => {
  if (!value) {
    throw new Error(`Variabile ambiente mancante: ${envName}`);
  }

  return value;
};

export const getSupabaseUrl = (): string => {
  return requireEnv(envSupabaseUrl, "VITE_SUPABASE_URL");
};

export const getSupabasePublishableKey = (): string => {
  return requireEnv(envSupabasePublishableKey, "VITE_SUPABASE_PUBLISHABLE_KEY");
};

export const getSupabaseProjectId = (): string => {
  const projectId = envSupabaseProjectId ?? resolveProjectRefFromUrl(getSupabaseUrl());
  return requireEnv(projectId, "VITE_SUPABASE_PROJECT_ID");
};

export const getEdgeFunctionsV1BaseUrl = (): string => {
  return `${getSupabaseUrl().replace(/\/+$/, "")}/functions/v1`;
};

export const getEdgeFunctionsSubdomainBaseUrl = (): string => {
  return `https://${getSupabaseProjectId()}.functions.supabase.co`;
};

export const getEdgeFunctionUrl = (
  functionName: string,
  options?: { mode?: "v1" | "subdomain" },
): string => {
  const baseUrl = options?.mode === "subdomain"
    ? getEdgeFunctionsSubdomainBaseUrl()
    : getEdgeFunctionsV1BaseUrl();

  const normalizedFunctionName = functionName.replace(/^\/+/, "");
  return `${baseUrl}/${normalizedFunctionName}`;
};

export const getAuthRedirectUrl = (path: string): string => {
  if (envAuthRedirectUrl) {
    return envAuthRedirectUrl;
  }

  return `${window.location.origin}${path}`;
};
