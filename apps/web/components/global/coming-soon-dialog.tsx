"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent } from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  icon?: ReactNode;

  /** Pass this to render an email-capture form instead of just a close button. */
  onSubmitEmail?: (email: string) => Promise<void> | void;
  emailPlaceholder?: string;
  submitLabel?: string;
  submittingLabel?: string;
  successTitle?: string;
  successDescription?: string;
  errorMessage?: string;
}

export function ComingSoonDialog({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  icon,
  onSubmitEmail,
  emailPlaceholder = "you@example.com",
  submitLabel = "Notify me",
  submittingLabel = "Submitting…",
  successTitle = "You're on the list!",
  successDescription = "We'll email you as soon as we launch.",
  errorMessage = "Something went wrong. Please try again.",
}: ComingSoonDialogProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setStatus("idle");
  }, [open]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onSubmitEmail || !email || status === "submitting") return;

    setStatus("submitting");
    try {
      await onSubmitEmail(email);
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  const showSuccess = onSubmitEmail && status === "success";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-xs">
        <Empty className="border-none p-0">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-14 rounded-2xl bg-primary/10 text-primary [&_svg:not([class*='size-'])]:size-6"
            >
              {icon ?? <Sparkles />}
            </EmptyMedia>
            <EmptyTitle className="text-base">
              {showSuccess ? successTitle : title}
            </EmptyTitle>
            <EmptyDescription>
              {showSuccess ? successDescription : description}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>

        {onSubmitEmail && !showSuccess && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={emailPlaceholder}
              aria-label={emailPlaceholder}
              disabled={status === "submitting"}
            />
            {status === "error" && (
              <p className="text-xs text-destructive">{errorMessage}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={status === "submitting"}
            >
              {status === "submitting" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {status === "submitting" ? submittingLabel : submitLabel}
            </Button>
          </form>
        )}

        <DialogClose
          render={
            <Button
              variant={onSubmitEmail && !showSuccess ? "ghost" : "default"}
              className="w-full"
            />
          }
        >
          {closeLabel}
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
