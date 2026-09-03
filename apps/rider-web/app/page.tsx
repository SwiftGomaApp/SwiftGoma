"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isSignedIn } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isSignedIn() ? "/deliveries" : "/sign-in");
  }, [router]);

  return null;
}
