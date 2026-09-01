import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Bike,
  CheckCircle2,
  CircleDollarSign,
  Handshake,
  MapPin,
  QrCode,
  ShieldCheck,
  ShoppingBag,
  Store,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { getServerLocale } from "@/lib/language";
import type { Locale } from "@/lib/language";
import { AboutStoreButtons } from "@/components/about/about-store-buttons";

const ABOUT_STRINGS: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    missionEyebrow: string;
    missionTitle: string;
    missionDescription: string;
    problemTitle: string;
    problemDescription: string;
    howTitle: string;
    howDescription: string;
    roles: {
      title: string;
      description: string;
    }[];
    principlesEyebrow: string;
    principlesTitle: string;
    principlesDescription: string;
    principles: {
      title: string;
      description: string;
    }[];
    businessEyebrow: string;
    businessTitle: string;
    businessDescription: string;
    businessPoints: {
      title: string;
      description: string;
    }[];
    ctaTitle: string;
    ctaDescription: string;
    ctaButton: string;
    comingSoonTitle: string;
    comingSoonDescription: string;
    comingSoonClose: string;
    waitlistPlaceholder: string;
    waitlistSubmit: string;
    waitlistSubmitting: string;
    waitlistSuccessTitle: string;
    waitlistSuccessDescription: string;
    waitlistError: string;
    location: string;
    appStoreEyebrow: string;
    appStoreName: string;
    playStoreEyebrow: string;
    playStoreName: string;
  }
> = {
  en: {
    eyebrow: "About Swiftgoma",
    title: "Making everyday commerce easier in Goma.",
    description:
      "Swiftgoma is a local marketplace and delivery platform built for Goma, DRC. We connect buyers, sellers, and riders in one simple flow from discovering products to receiving an order.",
    primaryCta: "Start shopping",
    secondaryCta: "Contact support",

    missionEyebrow: "Why Swiftgoma",
    missionTitle: "Built around the way Goma actually shops.",
    missionDescription:
      "E-commerce isn't just about putting products online. It's about creating enough trust for people to confidently buy, pay, and receive what they ordered. Swiftgoma is designed around that reality.",

    problemTitle: "Trust comes first.",
    problemDescription:
      "The DRC remains largely a cash economy, and trust is one of the biggest barriers to e-commerce adoption. That's why Swiftgoma doesn't try to force a completely new way of buying. Instead, we combine familiar payment options with technology that makes every step more reliable.",

    howTitle: "One platform. Three roles.",
    howDescription:
      "Swiftgoma brings the people involved in a local order together in one connected experience.",

    roles: [
      {
        title: "Buyers",
        description:
          "Discover local sellers, browse products, place orders, choose how to pay and receive them, track delivery, and confirm handoff.",
      },
      {
        title: "Sellers",
        description:
          "Manage products, accept orders, organize fulfillment, invite their own riders, and receive payouts.",
      },
      {
        title: "Riders",
        description:
          "Deliver orders for their affiliated seller, navigate to buyers, and confirm successful handoff.",
      },
    ],

    principlesEyebrow: "What we believe",
    principlesTitle: "Simple ideas behind a trusted marketplace.",
    principlesDescription:
      "Every part of Swiftgoma is designed around making local commerce more accessible, transparent, and dependable.",

    principles: [
      {
        title: "Cash on Delivery",
        description:
          "Cash remains the default payment option, while online payment and Swiftgoma Wallet provide additional choices.",
      },
      {
        title: "Verified handoff",
        description:
          "A one-time QR code confirms the handoff between the buyer and seller or rider, creating a clear moment of completion.",
      },
      {
        title: "Seller-owned delivery",
        description:
          "Riders belong to the sellers they work with. Swiftgoma provides the technology without becoming their employer.",
      },
      {
        title: "0% order commission",
        description:
          "Swiftgoma does not take a commission from orders. Our model is built around seller subscriptions and Wallet transactions.",
      },
    ],

    businessEyebrow: "A marketplace built for local business",
    businessTitle:
      "Helping local sellers grow without taking a cut of every order.",
    businessDescription:
      "Swiftgoma gives sellers the tools to bring their products online, manage orders, coordinate their own delivery network, and receive payments while keeping order commissions at 0%.",

    businessPoints: [
      {
        title: "Seller subscriptions",
        description:
          "Sellers can choose from Starter, Business, and Enterprise plans based on their needs.",
      },
      {
        title: "Swiftgoma Wallet",
        description:
          "The Wallet provides another payment option and generates revenue through top-up and withdrawal transactions.",
      },
      {
        title: "Direct delivery pricing",
        description:
          "Delivery fees are set by sellers and paid directly to them. Swiftgoma does not set or take a cut of delivery pricing.",
      },
    ],

    ctaTitle: "Make your first step the right one.",
    ctaDescription:
      "Discover local products, connect with trusted sellers, and get your orders delivered across Goma.",
    ctaButton: "Browse products",

    location: "Built for Goma, Democratic Republic of the Congo",

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
    eyebrow: "À propos de Swiftgoma",
    title: "Simplifier le commerce quotidien à Goma.",
    description:
      "Swiftgoma est une marketplace locale et une plateforme de livraison conçue pour Goma, en RDC. Nous connectons les acheteurs, les vendeurs et les livreurs dans un seul parcours, de la découverte des produits jusqu'à la réception de la commande.",
    primaryCta: "Commencer mes achats",
    secondaryCta: "Contacter le support",

    missionEyebrow: "Pourquoi Swiftgoma",
    missionTitle: "Conçu autour de la réalité de Goma.",
    missionDescription:
      "Le commerce en ligne ne consiste pas seulement à mettre des produits sur Internet. Il faut aussi créer suffisamment de confiance pour permettre aux clients d'acheter, de payer et de recevoir leurs commandes sereinement. Swiftgoma est conçu autour de cette réalité.",

    problemTitle: "La confiance avant tout.",
    problemDescription:
      "La RDC reste largement une économie basée sur les paiements en espèces, et la confiance représente l'un des principaux obstacles à l'adoption du commerce en ligne. Swiftgoma ne cherche donc pas à imposer une nouvelle façon d'acheter. Nous combinons plutôt des moyens de paiement familiers avec une technologie qui rend chaque étape plus fiable.",

    howTitle: "Une plateforme. Trois rôles.",
    howDescription:
      "Swiftgoma réunit les différents acteurs d'une commande locale dans une expérience connectée.",

    roles: [
      {
        title: "Acheteurs",
        description:
          "Découvrez les vendeurs locaux, consultez les produits, passez commande, choisissez votre mode de paiement et de réception, suivez la livraison et confirmez la remise.",
      },
      {
        title: "Vendeurs",
        description:
          "Gérez vos produits, acceptez les commandes, organisez leur traitement, invitez vos propres livreurs et recevez vos paiements.",
      },
      {
        title: "Livreurs",
        description:
          "Livrez les commandes pour votre vendeur affilié, rejoignez les acheteurs et confirmez la remise de la commande.",
      },
    ],

    principlesEyebrow: "Nos principes",
    principlesTitle: "Des idées simples pour une marketplace de confiance.",
    principlesDescription:
      "Chaque partie de Swiftgoma est pensée pour rendre le commerce local plus accessible, transparent et fiable.",

    principles: [
      {
        title: "Paiement à la livraison",
        description:
          "Le paiement en espèces reste l'option par défaut, avec le paiement en ligne et le Wallet Swiftgoma comme alternatives.",
      },
      {
        title: "Remise vérifiée",
        description:
          "Un QR code à usage unique confirme la remise entre l'acheteur et le vendeur ou le livreur.",
      },
      {
        title: "Livraison gérée par les vendeurs",
        description:
          "Les livreurs appartiennent aux vendeurs avec lesquels ils travaillent. Swiftgoma fournit la technologie sans devenir leur employeur.",
      },
      {
        title: "0 % de commission",
        description:
          "Swiftgoma ne prélève aucune commission sur les commandes. Notre modèle repose sur les abonnements vendeurs et les transactions du Wallet.",
      },
    ],

    businessEyebrow: "Une marketplace pour les entreprises locales",
    businessTitle:
      "Aider les vendeurs locaux à se développer sans prélever une commission sur chaque commande.",
    businessDescription:
      "Swiftgoma permet aux vendeurs de mettre leurs produits en ligne, gérer leurs commandes, organiser leur propre réseau de livraison et recevoir leurs paiements, tout en maintenant une commission de 0 % sur les commandes.",

    businessPoints: [
      {
        title: "Abonnements vendeurs",
        description:
          "Les vendeurs peuvent choisir entre les plans Starter, Business et Enterprise selon leurs besoins.",
      },
      {
        title: "Wallet Swiftgoma",
        description:
          "Le Wallet offre un moyen de paiement supplémentaire et génère des revenus grâce aux opérations de dépôt et de retrait.",
      },
      {
        title: "Tarification directe de la livraison",
        description:
          "Les frais de livraison sont définis par les vendeurs et leur sont directement versés.",
      },
    ],

    ctaTitle: "Faites le bon premier pas.",
    ctaDescription:
      "Découvrez les produits locaux, trouvez des vendeurs de confiance et faites-vous livrer vos commandes à Goma.",
    ctaButton: "Voir les produits",

    location: "Conçu pour Goma, République démocratique du Congo",

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
};

const ROLE_ICONS = [ShoppingBag, Store, Bike];

const PRINCIPLE_ICONS = [CircleDollarSign, QrCode, Handshake, CheckCircle2];

const BUSINESS_ICONS = [Store, Wallet, Bike];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = ABOUT_STRINGS[locale];

  return {
    title: `${t.eyebrow} | Swiftgoma`,
    description: t.description,
  };
}

export default async function AboutPage() {
  const locale = await getServerLocale();
  const t = ABOUT_STRINGS[locale];

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" />
              {t.location}
            </div>

            <p className="mb-4 text-sm font-medium text-muted-foreground">
              {t.eyebrow}
            </p>

            <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
              {t.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button>
                <Link href="/shops">{t.primaryCta}</Link>
              </Button>

              <Button variant="outline">
                <Link href="/support">{t.secondaryCta}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {t.missionEyebrow}
              </p>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.missionTitle}
              </h2>
            </div>

            <div className="space-y-8">
              <p className="text-lg leading-8 text-muted-foreground">
                {t.missionDescription}
              </p>

              <div className="rounded-2xl border bg-muted/30 p-6 sm:p-8">
                <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-background">
                  <ShieldCheck className="size-5" />
                </div>

                <h3 className="text-xl font-semibold tracking-tight">
                  {t.problemTitle}
                </h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {t.problemDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three roles */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.howTitle}
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              {t.howDescription}
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {t.roles.map((role, index) => {
              const Icon = ROLE_ICONS[index];

              return (
                <div
                  key={role.title}
                  className="rounded-2xl border bg-background p-6"
                >
                  <div className="mb-6 flex size-11 items-center justify-center rounded-xl bg-muted">
                    <Icon className="size-5" />
                  </div>

                  <h3 className="text-lg font-semibold">{role.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Principles */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-medium text-muted-foreground">
              {t.principlesEyebrow}
            </p>

            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t.principlesTitle}
            </h2>

            <p className="mt-4 leading-7 text-muted-foreground">
              {t.principlesDescription}
            </p>
          </div>

          <div className="mt-10 grid gap-x-8 gap-y-10 md:grid-cols-2">
            {t.principles.map((principle, index) => {
              const Icon = PRINCIPLE_ICONS[index];

              return (
                <div key={principle.title} className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-4" />
                  </div>

                  <div>
                    <h3 className="font-semibold">{principle.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {principle.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Business model */}
      <section className="border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                {t.businessEyebrow}
              </p>

              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.businessTitle}
              </h2>
            </div>

            <div>
              <p className="leading-7 text-muted-foreground">
                {t.businessDescription}
              </p>

              <div className="mt-8 divide-y rounded-2xl border bg-background">
                {t.businessPoints.map((point, index) => {
                  const Icon = BUSINESS_ICONS[index];

                  return (
                    <div key={point.title} className="flex gap-4 p-5 sm:p-6">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Icon className="size-4" />
                      </div>

                      <div>
                        <h3 className="font-medium">{point.title}</h3>

                        <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[28px] border bg-background px-6 py-16 text-center shadow-sm sm:px-10 sm:py-20">
            {/* Background glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-40 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl"
            />

            <div className="relative mx-auto max-w-2xl">
              <p className="text-sm font-medium text-muted-foreground">
                Swiftgoma
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {t.ctaTitle}
              </h2>

              <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted-foreground sm:text-base">
                {t.ctaDescription}
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <AboutStoreButtons
                  appStoreEyebrow={t.appStoreEyebrow}
                  appStoreName={t.appStoreName}
                  playStoreEyebrow={t.playStoreEyebrow}
                  playStoreName={t.playStoreName}
                  comingSoonTitle={t.comingSoonTitle}
                  comingSoonDescription={t.comingSoonDescription}
                  comingSoonClose={t.comingSoonClose}
                  waitlistPlaceholder={t.waitlistPlaceholder}
                  waitlistSubmit={t.waitlistSubmit}
                  waitlistSubmitting={t.waitlistSubmitting}
                  waitlistSuccessTitle={t.waitlistSuccessTitle}
                  waitlistSuccessDescription={t.waitlistSuccessDescription}
                  waitlistError={t.waitlistError}
                />

                {/* Browse products */}
                <Button className="h-11 w-full rounded-lg px-5 sm:w-auto">
                  <Link href="/products">{t.ctaButton}</Link>
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
