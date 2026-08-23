import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/forgotPassword-form";

export const metadata: Metadata = {
  title: "Forgot Password | SwiftGoma",
  description:
    "Reset your SwiftGoma account password securely using email verification.",
  robots: {
    index: false,
    follow: false,
  },
};

const ForgotPassword = () => {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </main>
  );
};

export default ForgotPassword;
