"use client";

import { AppShell } from "@/components/shell";
import { useProfile } from "@/lib/hooks";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = useProfile();
  if (!profile || !profile.onboarded) {
    return (
      <div className="flex min-h-dvh items-center justify-center" aria-busy="true">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  return <AppShell>{children}</AppShell>;
}
