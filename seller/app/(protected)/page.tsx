"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { sellerApi } from "@/lib/api/seller-api";
import { OnboardingStepper } from "@/components/dashboard/onboarding-stepper";
import { ShopsList } from "@/components/dashboard/shops-list";

const SellerDashboard = () => {
  const profileQuery = useQuery({
    queryKey: ["seller", "profile"],
    queryFn: () => sellerApi.getProfile().then((res) => res.data),
  });

  const kycQuery = useQuery({
    queryKey: ["seller", "kyc"],
    queryFn: () => sellerApi.getKycStatus().then((res) => res.data),
    enabled: !!profileQuery.data,
  });

  const subscriptionQuery = useQuery({
    queryKey: ["seller", "subscription"],
    queryFn: () => sellerApi.getSubscription().then((res) => res.data),
    enabled: kycQuery.data?.status === "APPROVED",
  });

  const shopsQuery = useQuery({
    queryKey: ["seller", "shops"],
    queryFn: () => sellerApi.listMyShops().then((res) => res.data),
    enabled: subscriptionQuery.data?.status === "ACTIVE",
  });

  const isLoading =
    profileQuery.isLoading ||
    (!!profileQuery.data && kycQuery.isLoading) ||
    (kycQuery.data?.status === "APPROVED" && subscriptionQuery.isLoading) ||
    (subscriptionQuery.data?.status === "ACTIVE" && shopsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasProfile = !!profileQuery.data;
  const kycStatus = kycQuery.data?.status ?? null;
  const subscriptionStatus = subscriptionQuery.data?.status ?? null;
  const onboardingComplete =
    hasProfile && kycStatus === "APPROVED" && subscriptionStatus === "ACTIVE";

  if (!onboardingComplete) {
    return (
      <OnboardingStepper
        hasProfile={hasProfile}
        kycStatus={kycStatus}
        subscriptionStatus={subscriptionStatus}
      />
    );
  }

  return <ShopsList shops={shopsQuery.data ?? []} />;
};

export default SellerDashboard;
