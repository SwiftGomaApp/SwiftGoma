import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Locale } from "@/lib/language";

const FAQS = [
  {
    id: "place-order",
    question: {
      en: "How do I place an order?",
      fr: "Comment passer une commande ?",
    },
    answer: {
      en: "Add products from a single shop to your cart  items from different shops can't be combined into one order. At checkout, choose delivery or pickup, pick a payment method, and confirm.",
      fr: "Ajoutez des produits d'une seule boutique à votre panier les articles de différentes boutiques ne peuvent pas être combinés en une seule commande. Lors de la validation, choisissez la livraison ou le retrait, sélectionnez un mode de paiement, puis confirmez.",
    },
  },
  {
    id: "payment-methods",
    question: {
      en: "What payment methods can I use?",
      fr: "Quels moyens de paiement puis-je utiliser ?",
    },
    answer: {
      en: "You can pay cash on delivery, or online through our mobile-money payment partners. Online payments are held in escrow and only released to the seller once your order's handoff QR code is scanned and verified.",
      fr: "Vous pouvez payer en espèces à la livraison, ou en ligne via nos partenaires de paiement mobile money. Les paiements en ligne sont conservés en séquestre et ne sont libérés au vendeur qu'une fois le code QR de remise scanné et vérifié.",
    },
  },
  {
    id: "qr-code",
    question: {
      en: "What is the QR code for at handoff?",
      fr: "À quoi sert le code QR lors de la remise ?",
    },
    answer: {
      en: "Each order has a QR code shown in your app. The rider or seller scans it at delivery or pickup to confirm you received your order this also releases the payment to the seller.",
      fr: "Chaque commande dispose d'un code QR affiché dans votre application. Le livreur ou le vendeur le scanne à la livraison ou au retrait pour confirmer que vous avez reçu votre commande cela libère aussi le paiement au vendeur.",
    },
  },
  {
    id: "commission",
    question: {
      en: "Does Swiftgoma take a commission on my sales?",
      fr: "Swiftgoma prélève-t-elle une commission sur mes ventes ?",
    },
    answer: {
      en: "No. Swiftgoma does not charge commission on the value of orders you keep 100% of what buyers pay for products. Our revenue comes only from seller subscription plans and wallet payout fees.",
      fr: "Non. Swiftgoma ne prélève aucune commission sur la valeur des commandes vous conservez 100 % de ce que les acheteurs paient pour les produits. Nos revenus proviennent uniquement des abonnements vendeur et des frais de retrait du portefeuille.",
    },
  },
] as const;

const STRINGS = {
  en: {
    eyebrow: "FAQ",
    title: "Frequently asked questions.",
    description: "Quick answers about ordering, paying, and delivery.",
    viewAll: "View all FAQs",
  },
  fr: {
    eyebrow: "FAQ",
    title: "Questions fréquentes.",
    description:
      "Des réponses rapides sur les commandes, les paiements et la livraison.",
    viewAll: "Voir toutes les FAQ",
  },
} as const;

export function FaqTeaser({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  return (
    <section className="border-t bg-muted/10">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-medium text-primary">{t.eyebrow}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
        </div>

        <Accordion className="mt-8">
          {FAQS.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger>{faq.question[locale]}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer[locale]}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/help" />}
          >
            {t.viewAll}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default FaqTeaser;
