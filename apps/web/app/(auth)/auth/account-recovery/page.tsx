import type { Metadata } from "next";

import { AccountRecoveryForm } from "@/components/auth/account-recovery-form";

export const metadata: Metadata = {
  title: "Recover Your Account",
  description:
    "Recover access to your SwiftGoma account securely by verifying your email and identity.",
  robots: {
    index: false,
    follow: false,
  },
};

const AccountRecovery = () => {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AccountRecoveryForm />
      </div>
    </main>
  );
};

export default AccountRecovery;
