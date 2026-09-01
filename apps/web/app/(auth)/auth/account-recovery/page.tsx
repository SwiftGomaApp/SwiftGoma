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

type SearchParams = Record<string, string | string[] | undefined>;

type Props = {
  searchParams: Promise<SearchParams>;
};

function firstValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

const AccountRecovery = async ({ searchParams }: Props) => {
  const sp = await searchParams;
  const initialEmail = firstValue(sp.email);

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <AccountRecoveryForm initialEmail={initialEmail} />
      </div>
    </main>
  );
};

export default AccountRecovery;
