import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  MessageCircle,
  Package,
  ShieldCheck,
  Store,
  Wallet,
  Bike,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/language";
import type { Locale } from "@/lib/language";
import { ContactSupportForm } from "@/components/legal/contact-support-form";

const SUPPORT_STRINGS: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    backToHelp: string;
    emailTitle: string;
    emailDescription: string;
    email: string;
    fasterHelpTitle: string;
    fasterHelpDescription: string;
    helpItems: string[];
    helpCenterTitle: string;
    helpCenterDescription: string;
    browseHelp: string;
    categoriesTitle: string;
    categories: {
      label: string;
      description: string;
    }[];
  }
> = {
  en: {
    eyebrow: "Swiftgoma Support",
    title: "How can we help?",
    description:
      "Tell us what happened and our support team will review your request and get back to you by email.",
    backToHelp: "Back to Help Center",

    emailTitle: "Email support",
    emailDescription:
      "Prefer email? You can contact our support team directly.",
    email: "support@swiftgoma.com",

    fasterHelpTitle: "For faster help",
    fasterHelpDescription:
      "Including the right information helps us resolve your request faster.",
    helpItems: [
      "Your account email",
      "Your order ID, if applicable",
      "A clear description of what happened",
      "When the issue occurred",
    ],

    helpCenterTitle: "Looking for an answer?",
    helpCenterDescription:
      "Check the Help Center first. You may find an immediate answer to your question.",
    browseHelp: "Browse Help Center",

    categoriesTitle: "What can we help with?",
    categories: [
      {
        label: "Orders",
        description: "Wrong, incomplete, delayed, or cancelled orders.",
      },
      {
        label: "Payments",
        description: "Payment, refund, escrow, or payout problems.",
      },
      {
        label: "Account & Security",
        description: "Login, password, 2FA, or account recovery.",
      },
      {
        label: "Seller & KYC",
        description: "Shop, verification, subscription, or selling issues.",
      },
      {
        label: "Delivery",
        description: "Rider, delivery, or order handoff problems.",
      },
      {
        label: "Privacy",
        description: "Questions about your personal data and privacy.",
      },
    ],
  },

  fr: {
    eyebrow: "Support Swiftgoma",
    title: "Comment pouvons-nous vous aider ?",
    description:
      "Expliquez-nous ce qui s'est passé et notre équipe support examinera votre demande avant de vous répondre par e-mail.",
    backToHelp: "Retour au Centre d'aide",

    emailTitle: "Support par e-mail",
    emailDescription:
      "Vous préférez l'e-mail ? Vous pouvez contacter directement notre équipe support.",
    email: "support@swiftgoma.com",

    fasterHelpTitle: "Pour une aide plus rapide",
    fasterHelpDescription:
      "Fournir les bonnes informations nous aide à traiter votre demande plus rapidement.",
    helpItems: [
      "L'e-mail associé à votre compte",
      "Votre numéro de commande, si nécessaire",
      "Une description claire du problème",
      "Le moment où le problème s'est produit",
    ],

    helpCenterTitle: "Vous cherchez une réponse ?",
    helpCenterDescription:
      "Consultez d'abord le Centre d'aide. Vous y trouverez peut-être immédiatement la réponse à votre question.",
    browseHelp: "Consulter le Centre d'aide",

    categoriesTitle: "Pour quels problèmes pouvons-nous vous aider ?",
    categories: [
      {
        label: "Commandes",
        description:
          "Commandes incorrectes, incomplètes, retardées ou annulées.",
      },
      {
        label: "Paiements",
        description:
          "Problèmes de paiement, remboursement, séquestre ou retrait.",
      },
      {
        label: "Compte et sécurité",
        description: "Connexion, mot de passe, 2FA ou récupération de compte.",
      },
      {
        label: "Vendeur et KYC",
        description:
          "Boutique, vérification, abonnement ou problèmes liés à la vente.",
      },
      {
        label: "Livraison",
        description:
          "Problèmes liés aux Livreurs, à la livraison ou à la remise.",
      },
      {
        label: "Confidentialité",
        description:
          "Questions concernant vos données personnelles et votre confidentialité.",
      },
    ],
  },
};

const CATEGORY_ICONS = [
  Package,
  Wallet,
  ShieldCheck,
  Store,
  Bike,
  MessageCircle,
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = SUPPORT_STRINGS[locale];

  return {
    title: `${t.title} | Swiftgoma`,
    description: t.description,
  };
}

export default async function SupportPage() {
  const locale = await getServerLocale();
  const t = SUPPORT_STRINGS[locale];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Back to Help */}
        <Link
          href="/help"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t.backToHelp}
        </Link>

        {/* Header */}
        <header className="mb-10 max-w-3xl">
          <p className="mb-3 text-sm font-medium text-muted-foreground">
            {t.eyebrow}
          </p>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {t.title}
          </h1>

          <p className="mt-4 text-base leading-7 text-muted-foreground">
            {t.description}
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* Contact form */}
          <section className="rounded-2xl border bg-card p-6 sm:p-8">
            <ContactSupportForm locale={locale} />
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Email */}
            <div className="rounded-2xl border bg-card p-6">
              <div className="mb-4 flex size-10 items-center justify-center rounded-xl bg-muted">
                <Mail className="size-5" />
              </div>

              <h2 className="font-semibold">{t.emailTitle}</h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.emailDescription}
              </p>

              <a
                href={`mailto:${t.email}`}
                className="mt-4 inline-flex text-sm font-medium underline underline-offset-4"
              >
                {t.email}
              </a>
            </div>

            {/* Faster help */}
            <div className="rounded-2xl border bg-muted/30 p-6">
              <h2 className="font-semibold">{t.fasterHelpTitle}</h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.fasterHelpDescription}
              </p>

              <ul className="mt-5 space-y-3">
                {t.helpItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1 size-1.5 shrink-0 rounded-full bg-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Help Center */}
            <div className="rounded-2xl border bg-card p-6">
              <h2 className="font-semibold">{t.helpCenterTitle}</h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t.helpCenterDescription}
              </p>

              <Button variant="outline" className="mt-4 w-full">
                <Link href="/help">{t.browseHelp}</Link>
              </Button>
            </div>
          </aside>
        </div>

        {/* Support categories */}
        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold tracking-tight">
              {t.categoriesTitle}
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.categories.map((category, index) => {
              const Icon = CATEGORY_ICONS[index];

              return (
                <div
                  key={category.label}
                  className="rounded-xl border bg-card p-5"
                >
                  <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </div>

                  <h3 className="font-medium">{category.label}</h3>

                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {category.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-12 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Swiftgoma Support · Goma, Democratic Republic of the Congo
          </p>
        </div>
      </div>
    </main>
  );
}
