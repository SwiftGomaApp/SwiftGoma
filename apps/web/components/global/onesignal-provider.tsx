"use client";

import { useEffect, useRef, useState } from "react";
import OneSignal from "react-onesignal";
import { useAuth } from "@/lib/auth/auth-context";

let initPromise: Promise<void> | null = null;

function ensureOneSignalInit(appId: string) {
  if (!initPromise) {
    initPromise = OneSignal.init({
      appId,
      allowLocalhostAsSecureOrigin: process.env.NODE_ENV !== "production",
    });
  }
  return initPromise;
}

export function OneSignalProvider() {
  const { user, isAuthenticated } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const loggedInUserId = useRef<string | null>(null);

  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) return;

    let cancelled = false;
    ensureOneSignalInit(appId).then(() => {
      if (!cancelled) setIsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (isAuthenticated && user?.id) {
      if (loggedInUserId.current !== user.id) {
        OneSignal.login(user.id);
        loggedInUserId.current = user.id;
      }
    } else if (loggedInUserId.current) {
      OneSignal.logout();
      loggedInUserId.current = null;
    }
  }, [isReady, isAuthenticated, user?.id]);

  return null;
}
