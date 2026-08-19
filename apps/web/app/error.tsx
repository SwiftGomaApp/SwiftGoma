"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { getClientLocale, type Locale } from "@/lib/language";

const messages: Record<
  Locale,
  {
    title: string;
    description: string;
    retry: string;
    goHome: string;
    contact: string;
  }
> = {
  en: {
    title: "Something went wrong",
    description:
      "An unexpected error occurred. You can try again, or head back home.",
    retry: "Try again",
    goHome: "Go back home",
    contact: "Contact support",
  },
  fr: {
    title: "Une erreur est survenue",
    description:
      "Une erreur inattendue s’est produite. Vous pouvez réessayer ou retourner à l’accueil.",
    retry: "Réessayer",
    goHome: "Retour à l’accueil",
    contact: "Contacter le support",
  },
};

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = messages[locale];

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">500</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-primary sm:text-7xl">
          {t.title}
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
          {t.description}
        </p>

        <div className="mt-8">
          <Button
            size="lg"
            onClick={() => reset()}
            className="gap-2 px-8 shadow-sm"
          >
            <RotateCw className="size-4" />
            {t.retry}
          </Button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-x-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.goHome}
          </button>
          <span className="h-4 w-px bg-border" aria-hidden="true" />

          <a
            href="/contact"
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {t.contact} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
}
