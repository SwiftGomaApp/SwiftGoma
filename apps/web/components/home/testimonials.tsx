import { Star } from "lucide-react";

import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    eyebrow: "Testimonials",
    title: "What people are saying.",
    description: "Early feedback from buyers, sellers, and riders in Goma.",
    testimonials: [
      {
        quote:
          "I order from a shop near my old neighborhood and it still gets to me the same day. Paying cash on delivery makes it easy to trust.",
        name: "Aline M.",
        role: "Buyer, Goma",
      },
      {
        quote:
          "I set up my shop, added my products, and started getting orders within a week — without giving up a percentage of every sale.",
        name: "Patrick K.",
        role: "Shop owner, Goma",
      },
      {
        quote:
          "Orders are clear and the QR handoff means there's never a dispute about whether I delivered. It's straightforward work.",
        name: "Chris B.",
        role: "Rider, Goma",
      },
    ],
  },
  fr: {
    eyebrow: "Témoignages",
    title: "Ce que les gens en disent.",
    description:
      "Les premiers retours des acheteurs, vendeurs et livreurs à Goma.",
    testimonials: [
      {
        quote:
          "Je commande dans une boutique près de mon ancien quartier et je suis livrée le jour même. Payer en espèces à la livraison, ça facilite la confiance.",
        name: "Aline M.",
        role: "Acheteuse, Goma",
      },
      {
        quote:
          "J'ai créé ma boutique, ajouté mes produits, et j'ai reçu mes premières commandes en une semaine — sans céder un pourcentage sur chaque vente.",
        name: "Patrick K.",
        role: "Propriétaire de boutique, Goma",
      },
      {
        quote:
          "Les commandes sont claires et le code QR à la remise évite tout litige sur la livraison. C'est un travail simple et fiable.",
        name: "Chris B.",
        role: "Livreur, Goma",
      },
    ],
  },
} as const;

export function Testimonials({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {t.testimonials.map((item) => (
          <figure
            key={item.name}
            className="flex flex-col rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex gap-0.5 text-primary">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="size-4 fill-current"
                  aria-hidden="true"
                />
              ))}
            </div>
            <blockquote className="mt-4 flex-1 text-sm leading-6 text-foreground">
              “{item.quote}”
            </blockquote>
            <figcaption className="mt-5 text-sm">
              <span className="font-medium text-foreground">{item.name}</span>
              <span className="block text-muted-foreground">{item.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

export default Testimonials;
