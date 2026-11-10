import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

export function validateSupabaseConfig(url: string, key: string): void {
  if (!url || !key) {
    throw new Error(
      "Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente e reinicie a aplicação.",
    );
  }
  if (!key.startsWith("sb_publishable_")) {
    throw new Error(
      "Use somente uma chave publicável Supabase (sb_publishable_). Chaves privilegiadas não são permitidas.",
    );
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) throw new Error();
  } catch {
    throw new Error("VITE_SUPABASE_URL deve ser uma URL HTTPS válida do projeto.");
  }
}

// Created only after mounting in the browser; never share sessions through SSR.
export function getSupabase(): SupabaseClient {
  if (typeof window === "undefined") throw new Error("Cliente disponível somente no navegador.");
  if (browserClient) return browserClient;
  const url = (import.meta.env["VITE_SUPABASE_URL"] ?? "").trim();
  const key = (import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "").trim();
  validateSupabaseConfig(url, key);
  browserClient = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  return browserClient;
}
