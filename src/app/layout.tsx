import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/inter";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { AppProvider } from "@/components/app-provider";
import { copy } from "@/lib/copy";

export const metadata: Metadata = {
  title: copy["brand.full"],
  description: "An offline-capable creator notebook with reliable capture, actionable reminders, and private cloud recovery.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#F8F7F3",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <Suspense>
          <AppProvider>{children}</AppProvider>
        </Suspense>
      </body>
    </html>
  );
}
