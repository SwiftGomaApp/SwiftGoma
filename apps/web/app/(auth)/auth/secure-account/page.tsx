import type { Metadata } from "next";

import { SecureAccountForm } from "@/components/auth/secure-account-form";

export const metadata: Metadata = {
  title: "Secure your account | SwiftGoma",
  robots: { index: false, follow: false },
};

export default function SecureAccountPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SecureAccountForm />
      </div>
    </main>
  );
}
