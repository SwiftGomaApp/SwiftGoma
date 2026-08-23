"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const TERMS_ACCEPTED_KEY = "swiftgoma_terms_accepted";

interface TermsConsentModalProps {
  onAccepted: () => void;
}

export function TermsConsentModal({ onAccepted }: TermsConsentModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(TERMS_ACCEPTED_KEY);

    if (accepted !== "true") {
      setOpen(true);
    } else {
      onAccepted();
    }
  }, [onAccepted]);

  const acceptTerms = () => {
    localStorage.setItem(TERMS_ACCEPTED_KEY, "true");

    setOpen(false);
    onAccepted();
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Accept SwiftGoma Terms & Conditions</DialogTitle>

          <DialogDescription>
            Before continuing, please review and accept our Terms & Conditions
            and Privacy Policy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-muted-foreground">
          <p>By continuing to use SwiftGoma, you agree to our:</p>

          <div className="flex flex-col gap-2">
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Terms & Conditions
            </Link>

            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              Privacy Policy
            </Link>
          </div>

          <p>
            You must accept these terms before you can continue using your
            account.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={acceptTerms} className="w-full">
            I Accept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
