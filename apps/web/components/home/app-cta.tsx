"use client";

import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    eyebrow: "Coming soon",
    title: "Take Swiftgoma with you.",
    description:
      "Our mobile app is on its way order from local shops, track deliveries, and manage your account on the go.",
    appStoreEyebrow: "Download on the",
    appStoreName: "App Store",
    playStoreEyebrow: "Get it on",
    playStoreName: "Google Play",
    comingSoonTitle: "Coming soon",
    comingSoonDescription:
      "Our mobile app isn't available yet. We'll let you know as soon as it launches.",
    comingSoonClose: "Got it",
    waitlistPlaceholder: "you@example.com",
    waitlistSubmit: "Notify me",
    waitlistSubmitting: "Submitting…",
    waitlistSuccessTitle: "You're on the list!",
    waitlistSuccessDescription: "We'll email you as soon as the app launches.",
    waitlistError: "Something went wrong. Please try again.",
  },
  fr: {
    eyebrow: "Bientôt disponible",
    title: "Emportez Swiftgoma partout avec vous.",
    description:
      "Notre application mobile arrive bientôt commandez auprès des boutiques locales, suivez vos livraisons et gérez votre compte où que vous soyez.",
    appStoreEyebrow: "Télécharger sur",
    appStoreName: "App Store",
    playStoreEyebrow: "Disponible sur",
    playStoreName: "Google Play",
    comingSoonTitle: "Bientôt disponible",
    comingSoonDescription:
      "Notre application mobile n'est pas encore disponible. Nous vous préviendrons dès son lancement.",
    comingSoonClose: "Compris",
    waitlistPlaceholder: "vous@exemple.com",
    waitlistSubmit: "Me prévenir",
    waitlistSubmitting: "Envoi…",
    waitlistSuccessTitle: "Vous êtes sur la liste !",
    waitlistSuccessDescription:
      "Nous vous enverrons un e-mail dès le lancement de l'application.",
    waitlistError: "Une erreur est survenue. Veuillez réessayer.",
  },
} as const;

import { ComingSoonDialog } from "@/components/global/coming-soon-dialog";
import { AppleIcon, PlayIcon } from "../global/icons";
import { useState } from "react";

export function AppCta({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const [comingSoonOpen, setComingSoonOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16">
        <p className="text-sm font-medium text-primary-foreground/80">
          {t.eyebrow}
        </p>
        <h2 className="max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
          {t.title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-primary-foreground/80 sm:text-base">
          {t.description}
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setComingSoonOpen(true)}
            aria-label={`${t.appStoreEyebrow} ${t.appStoreName}`}
            className="flex items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <AppleIcon />
            <span className="leading-tight text-left">
              <span className="block text-[10px] text-muted-foreground">
                {t.appStoreEyebrow}
              </span>
              <span className="block text-sm font-semibold">
                {t.appStoreName}
              </span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => setComingSoonOpen(true)}
            aria-label={`${t.playStoreEyebrow} ${t.playStoreName}`}
            className="flex items-center gap-2 rounded-lg bg-background px-4 py-2.5 text-foreground transition-opacity hover:opacity-85"
          >
            <PlayIcon />
            <span className="leading-tight text-left">
              <span className="block text-[10px] text-muted-foreground">
                {t.playStoreEyebrow}
              </span>
              <span className="block text-sm font-semibold">
                {t.playStoreName}
              </span>
            </span>
          </button>
        </div>
      </div>

      <ComingSoonDialog
        open={comingSoonOpen}
        onOpenChange={setComingSoonOpen}
        title={t.comingSoonTitle}
        description={t.comingSoonDescription}
        closeLabel={t.comingSoonClose}
        emailPlaceholder={t.waitlistPlaceholder}
        submitLabel={t.waitlistSubmit}
        submittingLabel={t.waitlistSubmitting}
        successTitle={t.waitlistSuccessTitle}
        successDescription={t.waitlistSuccessDescription}
        errorMessage={t.waitlistError}
        onSubmitEmail={async (email) => {
          // TODO: wire up to your waitlist endpoint once it exists
          console.log("Waitlist signup:", email);
        }}
      />
    </section>
  );
}

export default AppCta;
