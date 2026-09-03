"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SessionExpiredModal() {
  const { sessionExpired, dismissSessionExpired } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  function handleLogin() {
    dismissSessionExpired();
    router.push(buildSignInHref(pathname));
  }

  function handleOpenChange(open: boolean) {
    if (!open) return;
  }

  return (
    <Dialog open={sessionExpired} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Your session has expired</DialogTitle>
          <DialogDescription>
            For your security, you&apos;ve been signed out. Please log in again
            to continue.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleLogin}>Log in again</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
