"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CircleCheck, OctagonX } from "lucide-react";
import { ui } from "@/lib/i18n/common";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant?: "success" | "error";
  title: string;
  description?: string;
}

export function FeedbackDialog({
  open,
  onOpenChange,
  variant = "success",
  title,
  description,
}: FeedbackDialogProps) {
  const Icon = variant === "error" ? OctagonX : CircleCheck;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon
              className={
                variant === "error" ? "text-destructive h-5 w-5" : "text-green-600 h-5 w-5"
              }
            />
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onOpenChange(false)}>{ui.ok}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
