import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export const frontendClient = createClient(supabaseUrl, supabasePublicKey);

async function pingSupabase(): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: { apikey: supabasePublicKey },
      signal: AbortSignal.timeout(5_000),
    });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureConnection(retryMs = 15_000): Promise<void> {
  while (!(await pingSupabase())) {
    console.warn(`[Supabase] Unreachable — retrying in ${retryMs / 1000}s`);
    await new Promise<void>((resolve) => setTimeout(resolve, retryMs));
  }
}

// Resolves once Supabase is reachable; safe to import during SSR.
export const clientReady: Promise<void> =
  typeof window !== "undefined" ? ensureConnection() : Promise.resolve();
