import Link from "next/link";
import { t, type CopyKey } from "@/lib/copy";

export function LegalLine({ lead = "legal.continue" }: { lead?: CopyKey }) {
  return (
    <p className="text-center text-xs leading-relaxed text-muted/80 lg:text-left">
      {t(lead)}{" "}
      <Link href="/legal/terms" className="underline underline-offset-2 hover:text-ink">
        {t("legal.terms")}
      </Link>{" "}
      {t("legal.and")}{" "}
      <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-ink">
        {t("legal.privacy")}
      </Link>
      .
    </p>
  );
}
