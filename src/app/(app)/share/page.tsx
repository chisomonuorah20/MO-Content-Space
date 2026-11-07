"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/components/app-provider";

/** Receives shares from the OS (installed web app) and opens the Share to MO Content Space dialog. */
function ShareReceiver() {
  const params = useSearchParams();
  const router = useRouter();
  const { openImport } = useApp();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const text = params.get("text") ?? "";
    const url = params.get("url") ?? text.match(/https?:\/\/\S+/)?.[0] ?? undefined;
    openImport({ url, text: url ? undefined : text, title: params.get("title") ?? undefined });
    router.replace("/");
  }, [params, openImport, router]);
  return null;
}

export default function SharePage() {
  return (
    <Suspense>
      <ShareReceiver />
    </Suspense>
  );
}
