import { ProfileForm } from "@/components/onboarding/profile-form";
import { Logo } from "@/components/logo";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profil vendeur",
  description: "Créez votre profil vendeur SwiftGoma.",
};

export default function OnboardingProfilePage() {
  return (
    <div className="flex flex-col">
      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <ProfileForm />
        </div>
      </main>
    </div>
  );
}
