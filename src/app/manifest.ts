import type { MetadataRoute } from "next";

/** Installable web app. share_target lets the installed app appear in the OS share sheet (Android/Chrome). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MO Content Space",
    short_name: "MO Content",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F7F3",
    theme_color: "#176B66",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
    share_target: { action: "/share", method: "GET", params: { title: "title", text: "text", url: "url" } },
  } as MetadataRoute.Manifest;
}
