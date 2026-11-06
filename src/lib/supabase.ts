"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const MEDIA_BUCKET = "media";

/** True when cloud backup/sync is configured for this deployment. */
export const cloudEnabled = Boolean(url && anon);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient | null {
  if (!cloudEnabled) return null;
  if (!client) client = createClient(url!, anon!, { auth: { persistSession: true, autoRefreshToken: true } });
  return client;
}
