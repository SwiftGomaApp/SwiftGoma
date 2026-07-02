"use client";

import Link from "next/link";
import { Check, ChevronRight, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { KycStatus, SubscriptionStatus } from "@/lib/api/seller-api";

type StepStatus = "done" | "current" | "pending" | "rejected" | "review";

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  status: StepStatus;
  href: string;
  cta: string;
}

interface OnboardingStepperProps {
  hasProfile: boolean;
  kycStatus: KycStatus | null;
  subscriptionStatus: SubscriptionStatus | null;
}

const statusBadge = (status: StepStatus) => {
  switch (status) {
    case "done":
      return (
        <Badge className="gap-1 bg-green-600 text-white hover:bg-green-600">
          <Check className="size-3" />
          Terminé
        </Badge>
      );
    case "review":
      return (
        <Badge variant="secondary" className="gap-1">
          <Clock className="size-3" />
          En cours de validation
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive" className="gap-1">
          <X className="size-3" />
          Refusé
        </Badge>
      );
    case "current":
      return <Badge>À faire</Badge>;
    default:
      return <Badge variant="outline">En attente</Badge>;
  }
};

export function OnboardingStepper({
  hasProfile,
  kycStatus,
  subscriptionStatus,
}: OnboardingStepperProps) {
  const profileStatus: StepStatus = hasProfile ? "done" : "current";

  let kycStepStatus: StepStatus = "pending";
  if (!hasProfile) kycStepStatus = "pending";
  else if (kycStatus === "APPROVED") kycStepStatus = "done";
  else if (kycStatus === "SUBMITTED") kycStepStatus = "review";
  else if (kycStatus === "REJECTED") kycStepStatus = "rejected";
  else kycStepStatus = "current";

  let subStepStatus: StepStatus = "pending";
  if (kycStatus !== "APPROVED") subStepStatus = "pending";
  else if (subscriptionStatus === "ACTIVE") subStepStatus = "done";
  else subStepStatus = "current";

  const steps: OnboardingStep[] = [
    {
      key: "profile",
      title: "Créer votre profil vendeur",
      description:
        "Renseignez le nom de votre activité et votre localisation à Goma.",
      status: profileStatus,
      href: "/onboarding/profile",
      cta: "Compléter le profil",
    },
    {
      key: "kyc",
      title: "Vérification d'identité (KYC)",
      description:
        "Téléversez une pièce d'identité valide pour vérifier votre compte.",
      status: kycStepStatus,
      href: "/onboarding/kyc",
      cta:
        kycStatus === "REJECTED"
          ? "Soumettre à nouveau"
          : "Soumettre les documents",
    },
    {
      key: "subscription",
      title: "Choisir un plan d'abonnement",
      description:
        "Sélectionnez Starter, Business ou Entreprise et payez via Mobile Money.",
      status: subStepStatus,
      href: "/onboarding/subscription",
      cta: "Choisir un plan",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold">Bienvenue sur SwiftGoma.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complétez ces étapes pour activer votre boutique et commencer à
          vendre.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {steps.map((step, i) => {
          const isActionable =
            step.status === "current" || step.status === "rejected";

          return (
            <Card
              key={step.key}
              className={cn(
                step.status === "done" && "border-green-600/30 bg-green-600/5",
                step.status === "rejected" && "border-destructive/30",
              )}
            >
              <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                <div className="flex gap-3">
                  <div
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      step.status === "done" &&
                        "border-green-600 bg-green-600 text-white",
                      step.status === "current" &&
                        "border-primary text-primary",
                      step.status === "pending" &&
                        "border-muted-foreground/30 text-muted-foreground",
                      step.status === "review" &&
                        "border-amber-500 text-amber-500",
                      step.status === "rejected" &&
                        "border-destructive text-destructive",
                    )}
                  >
                    {step.status === "done" ? (
                      <Check className="size-3.5" />
                    ) : (
                      i + 1
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {step.description}
                    </CardDescription>
                  </div>
                </div>
                {statusBadge(step.status)}
              </CardHeader>

              {isActionable && (
                <CardContent className="pt-0">
                  <Button asChild size="sm">
                    <Link href={step.href}>
                      {step.cta}
                      <ChevronRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
