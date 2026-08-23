import type { Metadata } from "next";

import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = {
  title: "Create Account | SwiftGoma",
  description: "Create your SwiftGoma account and get started securely.",
  robots: {
    index: false,
    follow: false,
  },
};

const SignUpPage = () => {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <SignupForm />
      </div>
    </main>
  );
};

export default SignUpPage;
