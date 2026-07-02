import { SubscriptionForm } from "@/components/onboarding/subscription-form";
import { BackButton } from "@/components/onboarding/back-button";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choisir un plan",
  description: "Choisissez votre plan d'abonnement SwiftGoma.",
};

export default function OnboardingSubscriptionPage() {
  return (
    <div className="flex flex-col">
      <header className="w-full px-6 py-5">
        <BackButton />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full">
          <SubscriptionForm />
        </div>
      </main>
    </div>
  );
}
