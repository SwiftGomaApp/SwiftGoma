"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getClientLocale, type Locale } from "@/lib/language";

const messages: Record<
  Locale,
  {
    code: string;
    title: string;
    description: string;
    goHome: string;
    contact: string;
  }
> = {
  en: {
    code: "404",
    title: "Page not found",
    description: "Sorry, we couldn’t find the page you’re looking for.",
    goHome: "Go back home",
    contact: "Contact support",
  },
  fr: {
    code: "404",
    title: "Page introuvable",
    description: "Désolé, nous n’avons pas trouvé la page que vous recherchez.",
    goHome: "Retour à l’accueil",
    contact: "Contacter le support",
  },
};

const NotFoundPage = () => {
  const router = useRouter();
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = messages[locale];

  return (
    <main className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-base font-semibold text-muted-foreground">
          {t.code}
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-primary sm:text-7xl">
          {t.title}
        </h1>
        <p className="mt-6 text-lg font-medium text-pretty text-muted-foreground sm:text-xl/8">
          {t.description}
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Button onClick={() => router.push("/")}>{t.goHome}</Button>

          <a
            href="/contact"
            className="text-sm font-semibold text-muted-foreground"
          >
            {t.contact} <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
