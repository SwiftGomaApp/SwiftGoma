import { KycForm } from "@/components/onboarding/kyc-form";
import { BackButton } from "@/components/onboarding/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vérification d'identité",
  description: "Vérifiez votre identité pour activer votre boutique.",
};

export default function OnboardingKycPage() {
  return (
    <div className="flex flex-col">
      <header className="w-full px-6 py-5">
        <BackButton />
      </header>

      <main className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <KycForm />
        </div>
      </main>
    </div>
  );
}
