import { siFacebook, siInstagram, siTiktok, siX, siYoutube } from "simple-icons";
import { Globe } from "lucide-react";
import type { Platform } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";

const PATHS: Partial<Record<Platform, string>> = {
  tiktok: siTiktok.path,
  instagram: siInstagram.path,
  x: siX.path,
  youtube: siYoutube.path,
  facebook: siFacebook.path,
};

/** Monochrome platform glyph (inherits currentColor). LinkedIn isn't in simple-icons, so it gets a lettermark. */
export function PlatformIcon({ platform, className = "size-4" }: { platform: Platform; className?: string }) {
  const path = PATHS[platform];
  if (path)
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    );
  if (platform === "linkedin")
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden>
        <rect width="24" height="24" rx="4" fill="currentColor" />
        <text x="12" y="17" textAnchor="middle" fontSize="13" fontWeight="900" fill="white" fontFamily="Inter, sans-serif">
          in
        </text>
      </svg>
    );
  return <Globe className={className} aria-hidden />;
}

export const platformLabel = (p: Platform) => PLATFORMS.find((x) => x.id === p)?.label ?? p;

export const PLAN_STATE_KEY = { draft: "plan.state.draft", in_progress: "plan.state.in_progress", ready: "plan.state.ready", published: "plan.state.published" } as const;
