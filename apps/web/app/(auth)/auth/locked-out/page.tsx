import type { Metadata } from "next";

import { LockedOutForm } from "@/components/auth/locked-out-form";

export const metadata: Metadata = {
  title: "Locked out? | SwiftGoma",
  robots: { index: false, follow: false },
};

export default function LockedOutPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LockedOutForm />
      </div>
    </main>
  );
}
