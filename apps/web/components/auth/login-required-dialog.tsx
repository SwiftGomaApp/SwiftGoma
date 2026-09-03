"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type LoginRequiredContent = {
  title: string;
  description: string;
  signInLabel: string;
  cancelLabel: string;
};

export function LoginRequiredDialog({
  open,
  onOpenChange,
  content,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: LoginRequiredContent | null;
}) {
  const pathname = usePathname();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {content && (
          <>
            <DialogHeader>
              <DialogTitle>{content.title}</DialogTitle>
              <DialogDescription>{content.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {content.cancelLabel}
              </Button>
              <Button
                nativeButton={false}
                render={
                  <Link
                    href={buildSignInHref(pathname)}
                    onClick={() => onOpenChange(false)}
                  />
                }
              >
                {content.signInLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default LoginRequiredDialog;
