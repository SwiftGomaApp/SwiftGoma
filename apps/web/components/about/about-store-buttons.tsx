"use client";

import { useState } from "react";
import { ComingSoonDialog } from "@/components/global/coming-soon-dialog";
import { AppleIcon, PlayIcon } from "../global/icons";
import { Button } from "../ui/button";

type Props = {
  appStoreEyebrow: string;
  appStoreName: string;
  playStoreEyebrow: string;
  playStoreName: string;
  comingSoonTitle: string;
  comingSoonDescription: string;
  comingSoonClose: string;
  waitlistPlaceholder: string;
  waitlistSubmit: string;
  waitlistSubmitting: string;
  waitlistSuccessTitle: string;
  waitlistSuccessDescription: string;
  waitlistError: string;
};

export function AboutStoreButtons(props: Props) {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={"outline"}
        onClick={() => setComingSoonOpen(true)}
        aria-label={`${props.appStoreEyebrow} ${props.appStoreName}`}
        className="flex items-center gap-2 px-4 py-2.5 h-11"
      >
        <AppleIcon />
        <span className="leading-tight text-left">
          <span className="block text-[10px]">{props.appStoreEyebrow}</span>
          <span className="block text-sm font-semibold">
            {props.appStoreName}
          </span>
        </span>
      </Button>

      <Button
        type="button"
        variant={"outline"}
        onClick={() => setComingSoonOpen(true)}
        aria-label={`${props.playStoreEyebrow} ${props.playStoreName}`}
        className="flex items-center gap-2 px-4 py-2.5 h-11"
      >
        <PlayIcon />
        <span className="leading-tight text-left">
          <span className="block text-[10px]">{props.playStoreEyebrow}</span>
          <span className="block text-sm font-semibold">
            {props.playStoreName}
          </span>
        </span>
      </Button>

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        title={props.comingSoonTitle}
        description={props.comingSoonDescription}
        closeLabel={props.comingSoonClose}
        emailPlaceholder={props.waitlistPlaceholder}
        submitLabel={props.waitlistSubmit}
        submittingLabel={props.waitlistSubmitting}
        successTitle={props.waitlistSuccessTitle}
        successDescription={props.waitlistSuccessDescription}
        errorMessage={props.waitlistError}
        onSubmitEmail={async (email: string) => {
          // TODO: wire up to your waitlist endpoint once it exists
          console.log("Waitlist signup:", email);
        }}
      />
    </>
  );
}
