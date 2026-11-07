import Link from "next/link";

export const metadata = { title: "Legal — MO Content Space" };

export default function LegalPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="mb-4 text-3xl font-black tracking-tight">Terms of Service and Privacy Policy</h1>
      <p className="text-muted">
        These documents will be published before public launch (PRD §8: retention, deletion and third-party processing must be documented first).
      </p>
      <Link href="/welcome" className="mt-8 inline-block font-bold text-primary underline">
        Back
      </Link>
    </main>
  );
}
