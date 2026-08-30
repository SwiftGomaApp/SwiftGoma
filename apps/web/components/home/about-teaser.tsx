import Link from "next/link";
import { ArrowRight, Bike, ShoppingBag, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/language";

const ROLE_ICONS = [ShoppingBag, Store, Bike];

const STRINGS = {
  en: {
    eyebrow: "About Swiftgoma",
    title: "Making everyday commerce easier in Goma.",
    description:
      "Swiftgoma is a local marketplace and delivery platform built for Goma, DRC. We connect buyers, sellers, and riders in one simple flow  from discovering products to receiving an order.",
    learnMore: "Learn more about us",
    roles: [
      {
        title: "Buyers",
        description:
          "Discover local sellers, browse products, place orders, and track delivery to confirm handoff.",
      },
      {
        title: "Sellers",
        description:
          "Manage products, accept orders, organize fulfillment, and invite their own riders.",
      },
      {
        title: "Riders",
        description:
          "Deliver orders for their affiliated seller and confirm successful handoff.",
      },
    ],
  },
  fr: {
    eyebrow: "À propos de Swiftgoma",
    title: "Simplifier le commerce quotidien à Goma.",
    description:
      "Swiftgoma est une marketplace locale et une plateforme de livraison conçue pour Goma, en RDC. Nous connectons les acheteurs, les vendeurs et les livreurs dans un seul parcours, de la découverte des produits jusqu'à la réception de la commande.",
    learnMore: "En savoir plus sur nous",
    roles: [
      {
        title: "Acheteurs",
        description:
          "Découvrez les vendeurs locaux, consultez les produits, passez commande et suivez la livraison.",
      },
      {
        title: "Vendeurs",
        description:
          "Gérez vos produits, acceptez les commandes, organisez leur traitement et invitez vos propres livreurs.",
      },
      {
        title: "Livreurs",
        description:
          "Livrez les commandes pour votre vendeur affilié et confirmez la remise de la commande.",
      },
    ],
  },
} as const;

export function AboutTeaser({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <section className="border-t bg-muted/10">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {t.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {t.description}
            </p>
            <Button
              variant="outline"
              className="mt-6"
              nativeButton={false}
              render={<Link href="/about" />}
            >
              {t.learnMore}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:gap-4">
            {t.roles.map((role, index) => {
              const Icon = ROLE_ICONS[index];
              return (
                <div
                  key={role.title}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-foreground">
                    {role.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    {role.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutTeaser;
