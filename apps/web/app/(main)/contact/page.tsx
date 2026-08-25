import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HelpCircle, Mail, MessageCircle } from "lucide-react";

import { ContactSupportForm } from "@/components/legal/contact-support-form";
import { Button } from "@/components/ui/button";
import { getServerLocale, type Locale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Contact | Swiftgoma",
  description: "Contact the Swiftgoma support team.",
};

const COPY: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    formEyebrow: string;
    emailTitle: string;
    emailDescription: string;
    helpTitle: string;
    helpDescription: string;
    helpAction: string;
    supportTitle: string;
    supportDescription: string;
  }
> = {
  en: {
    eyebrow: "Contact Swiftgoma",
    title: "We’re here to help.",
    description:
      "Have a question about Swiftgoma, an order, or your account? Send us a message and our team will get back to you by email.",
    formEyebrow: "Send a message",
    emailTitle: "Email support",
    emailDescription: "Prefer email? Reach our support team directly.",
    helpTitle: "Find an answer first",
    helpDescription:
      "Our Help Center covers common questions about orders, payments, and accounts.",
    helpAction: "Visit Help Center",
    supportTitle: "A better way to get support",
    supportDescription:
      "Include your account email and order number when relevant. It helps us understand your request and respond with the right information.",
  },
  fr: {
    eyebrow: "Contacter Swiftgoma",
    title: "Nous sommes là pour vous aider.",
    description:
      "Une question sur Swiftgoma, une commande ou votre compte ? Envoyez-nous un message et notre équipe vous répondra par e-mail.",
    formEyebrow: "Envoyer un message",
    emailTitle: "Support par e-mail",
    emailDescription:
      "Vous préférez l'e-mail ? Contactez directement notre équipe support.",
    helpTitle: "Trouvez d'abord une réponse",
    helpDescription:
      "Notre Centre d'aide couvre les questions fréquentes sur les commandes, les paiements et les comptes.",
    helpAction: "Voir le Centre d'aide",
    supportTitle: "Une aide plus efficace",
    supportDescription:
      "Ajoutez l'e-mail de votre compte et votre numéro de commande si nécessaire. Cela nous aide à comprendre votre demande et à vous répondre précisément.",
  },
};

export default async function ContactPage() {
  const locale = await getServerLocale();
  const t = COPY[locale];

  return (
    <main>
      <section className="border-b bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
          <div className="rounded-3xl border bg-card p-6 sm:p-8">
            <p className="text-sm font-medium text-primary">{t.formEyebrow}</p>
            <div className="mt-4">
              <ContactSupportForm locale={locale} />
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold tracking-tight">
                {t.emailTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.emailDescription}
              </p>
              <a
                href="mailto:support@swiftgoma.com"
                className="mt-4 inline-flex text-sm font-medium text-primary underline underline-offset-4"
              >
                support@swiftgoma.com
              </a>
            </div>

            <div className="rounded-2xl border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HelpCircle className="size-5" aria-hidden="true" />
              </div>
              <h2 className="mt-4 font-semibold tracking-tight">
                {t.helpTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.helpDescription}
              </p>
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/help" />}
                className="mt-5 w-full"
              >
                {t.helpAction}
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
              <MessageCircle className="size-5" aria-hidden="true" />
              <h2 className="mt-4 font-semibold tracking-tight">
                {t.supportTitle}
              </h2>
              <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
                {t.supportDescription}
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
