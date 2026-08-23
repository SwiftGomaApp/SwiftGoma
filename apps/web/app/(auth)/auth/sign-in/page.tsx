import type { Metadata } from "next";

import SignInPage from "@/components/auth/sign-in-page";

export const metadata: Metadata = {
  title: "Sign In",
  description:
    "Sign in securely to your SwiftGoma account and access your dashboard.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <SignInPage />;
}
