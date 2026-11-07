"use client";

/**
 * Account flows (AUTH-01). With Supabase configured: email + password accounts, as in the
 * UX Pilot auth frames, plus password recovery. Without it: a device-only profile, and the
 * screens say plainly that nothing is backed up.
 */
import { cloudEnabled, supabase } from "./supabase";
import { getProfile, setProfile, uid, wipeLocal } from "./repo";
import type { Session } from "@supabase/supabase-js";

export class AuthError extends Error {}

const firstNameOf = (full: string) => full.trim().split(/\s+/)[0] ?? "";

/** Create (or switch to) the device profile for a cloud session. Never mixes accounts on one device. */
export async function adoptSession(session: Session) {
  const existing = await getProfile();
  if (existing && existing.user_id === session.user.id) return existing;
  if (existing) await wipeLocal();
  const meta = session.user.user_metadata ?? {};
  const first = (meta.first_name as string | undefined) || firstNameOf((meta.full_name as string | undefined) ?? "") || session.user.email?.split("@")[0] || "";
  await setProfile({ user_id: session.user.id, first_name: first, email: session.user.email ?? null, mode: "cloud", onboarded: Boolean(meta.onboarded) });
}

export async function register(fullName: string, email: string, password: string): Promise<"signed_in" | "confirm_email"> {
  if (!cloudEnabled) {
    await setProfile({ user_id: uid(), first_name: firstNameOf(fullName), email: email.trim() || null, mode: "local", onboarded: false });
    return "signed_in";
  }
  if (password.length < 8) throw new AuthError("auth.password.hint");
  const { data, error } = await supabase()!.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim(), first_name: firstNameOf(fullName) }, emailRedirectTo: `${location.origin}/sign-in` },
  });
  if (error) throw new AuthError(error.message);
  if (data.session) {
    await adoptSession(data.session);
    return "signed_in";
  }
  return "confirm_email";
}

export async function signIn(email: string, password: string, localName?: string) {
  if (!cloudEnabled) {
    await setProfile({ user_id: uid(), first_name: firstNameOf(localName ?? "") || email.split("@")[0], email: email.trim() || null, mode: "local", onboarded: false });
    return;
  }
  const { data, error } = await supabase()!.auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) throw new AuthError("auth.signin.error");
  await adoptSession(data.session);
}

export async function sendReset(email: string) {
  if (!cloudEnabled) throw new AuthError("auth.reset.local");
  const { error } = await supabase()!.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${location.origin}/reset-password` });
  if (error) throw new AuthError(error.message);
}

export async function updatePassword(password: string) {
  if (password.length < 8) throw new AuthError("auth.password.hint");
  const { data, error } = await supabase()!.auth.updateUser({ password });
  if (error) throw new AuthError(error.message);
  const { data: s } = await supabase()!.auth.getSession();
  if (s.session) await adoptSession(s.session);
  return data;
}

export async function markOnboarded(preferred: import("./types").Platform[]) {
  const p = await getProfile();
  if (!p) return;
  await setProfile({ ...p, onboarded: true, preferred_platforms: preferred });
  if (p.mode === "cloud") await supabase()?.auth.updateUser({ data: { onboarded: true } });
}

export const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
