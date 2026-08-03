// app/(main)/help/page.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  MessageCircle,
  ShoppingBag,
  Store,
  Bike,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ContactSupport } from "@/components/legal/contact-support";
import { buildWhatsAppLink } from "@/lib/whatsapp";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  faqs: FaqItem[];
};

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: "general",
    label: "Général",
    icon: ShieldCheck,
    faqs: [
      {
        question: "Qu'est-ce que Swiftgoma ?",
        answer:
          "Swiftgoma est une plateforme qui connecte acheteurs, vendeurs et livreurs pour des achats en ligne rapides et sécurisés en RDC et au Rwanda.",
      },
      {
        question: "Swiftgoma est-il disponible dans ma ville ?",
        answer:
          "La disponibilité dépend des Vendeurs et Livreurs actifs dans votre zone. Vous pouvez filtrer les produits par ville lors de votre recherche pour voir ce qui est livrable chez vous.",
      },
      {
        question: "Comment contacter le support ?",
        answer:
          "Vous pouvez utiliser le formulaire de contact en bas de cette page, nous écrire sur WhatsApp, ou nous envoyer un email à support@swiftgoma.com.",
      },
    ],
  },
  {
    id: "buyer",
    label: "Acheteurs",
    icon: ShoppingBag,
    faqs: [
      {
        question: "Comment passer une commande ?",
        answer:
          "Parcourez les produits, ajoutez-les à votre panier, puis choisissez votre mode de paiement (en ligne via MbiyoPay, ou paiement à la livraison) au moment de valider votre commande.",
      },
      {
        question: "Quand mon paiement est-il débité ?",
        answer:
          "Pour un paiement en ligne, le montant est retenu par Swiftgoma dès la confirmation de la commande par le Vendeur, puis reversé à celui-ci une fois que vous confirmez avoir reçu votre colis. Pour un paiement à la livraison, aucun montant n'est prélevé à l'avance.",
      },
      {
        question: "Comment confirmer la réception de ma commande ?",
        answer:
          "Un code QR s'affiche sur votre application au moment de la livraison. Présentez-le au Livreur pour qu'il le scanne et confirme la remise du colis.",
      },
      {
        question: "Que faire si mon colis n'arrive pas ?",
        answer:
          "Vous pouvez ouvrir un litige directement depuis votre espace Acheteur. Notre équipe et le Vendeur concerné vous aideront à trouver une solution.",
      },
      {
        question: "Comment annuler une commande ?",
        answer:
          "Vous pouvez annuler une commande tant qu'elle n'a pas été confirmée par le Vendeur, directement depuis votre espace Acheteur.",
      },
    ],
  },
  {
    id: "seller",
    label: "Vendeurs",
    icon: Store,
    faqs: [
      {
        question: "Comment devenir Vendeur sur Swiftgoma ?",
        answer:
          "Créez un compte Vendeur depuis l'application, puis fournissez les informations d'identification requises. Votre compte sera activé après vérification.",
      },
      {
        question: "Swiftgoma prend-il une commission sur mes ventes ?",
        answer:
          "Non. Swiftgoma ne prélève aucune commission sur vos ventes. L'accès à la plateforme peut être soumis à un abonnement payant, traité via PawaPay.",
      },
      {
        question: "Quand suis-je payé pour une vente ?",
        answer:
          "Les fonds sont crédités à votre Portefeuille dès que le colis est remis à l'Acheteur et confirmé par scan du code QR. Vous pouvez ensuite retirer vos fonds via MbiyoPay, avec validation par code OTP.",
      },
      {
        question:
          "Que se passe-t-il si je ne confirme pas une commande à temps ?",
        answer:
          "Vous disposez d'un délai maximal d'un jour pour confirmer une commande. Passé ce délai, elle est automatiquement annulée et l'Acheteur est remboursé si un paiement en ligne avait été effectué.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Livreurs",
    icon: Bike,
    faqs: [
      {
        question: "Comment devenir Livreur ?",
        answer:
          "Créez un compte Livreur depuis l'application et fournissez les informations demandées. Vous êtes ensuite mis en relation avec des Vendeurs pour effectuer des livraisons.",
      },
      {
        question: "Suis-je employé par Swiftgoma ?",
        answer:
          "Non. En tant que Livreur, vous êtes lié contractuellement au Vendeur pour lequel vous effectuez une livraison, et non à Swiftgoma, qui agit uniquement comme intermédiaire technique.",
      },
      {
        question: "Comment confirmer une livraison ?",
        answer:
          "Scannez le code QR affiché sur l'application de l'Acheteur au moment de la remise du colis. C'est la seule preuve reconnue de livraison réussie.",
      },
    ],
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return FAQ_CATEGORIES;

    const query = search.toLowerCase();
    return FAQ_CATEGORIES.map((category) => ({
      ...category,
      faqs: category.faqs.filter(
        (faq) =>
          faq.question.toLowerCase().includes(query) ||
          faq.answer.toLowerCase().includes(query),
      ),
    })).filter((category) => category.faqs.length > 0);
  }, [search]);

  const hasResults = filteredCategories.length > 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Comment pouvons-nous vous aider ?
        </h1>
        <p className="max-w-xl text-muted-foreground">
          Trouvez des réponses aux questions les plus fréquentes, ou contactez
          directement notre équipe.
        </p>

        <div className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une question..."
            className="h-11 pl-9"
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={buildWhatsAppLink(
            "243855078387",
            "Bonjour, j'ai une question concernant SwiftGoma.",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
        >
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Discuter sur WhatsApp
            </p>
            <p className="text-xs text-muted-foreground">
              Réponse rapide, du lundi au samedi
            </p>
          </div>
        </a>

        <a
          href="mailto:support@swiftgoma.com"
          className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted"
        >
          <ShieldCheck className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Nous écrire par email
            </p>
            <p className="text-xs text-muted-foreground">
              support@swiftgoma.com
            </p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        {search.trim() ? (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold text-foreground">
              Résultats pour « {search} »
            </h2>
            {hasResults ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="flex flex-col gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {category.label}
                  </h3>
                  <Accordion className="w-full">
                    {category.faqs.map((faq, i) => (
                      <AccordionItem key={i} value={`${category.id}-${i}`}>
                        <AccordionTrigger>{faq.question}</AccordionTrigger>
                        <AccordionContent>{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-border py-10 text-center">
                <p className="text-sm font-medium text-foreground">
                  Aucun résultat trouvé
                </p>
                <p className="text-sm text-muted-foreground">
                  Essayez une autre recherche, ou contactez-nous directement
                  ci-dessous.
                </p>
              </div>
            )}
          </div>
        ) : (
          <Tabs defaultValue="general">
            <TabsList className="mb-6 flex w-full flex-wrap justify-start gap-1 bg-transparent p-0">
              {FAQ_CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id}>
                    <Icon className="mr-1.5 h-4 w-4" />
                    {category.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {FAQ_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <Accordion className="w-full">
                  {category.faqs.map((faq, i) => (
                    <AccordionItem key={i} value={`${category.id}-${i}`}>
                      <AccordionTrigger>{faq.question}</AccordionTrigger>
                      <AccordionContent>{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      {/* Legal shortcuts */}
      <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-border pt-8 text-sm text-muted-foreground">
        <span>Pour en savoir plus :</span>
        <Link
          href="/legal/terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Conditions générales
        </Link>
        <Link
          href="/legal/buyer-terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Conditions Acheteurs
        </Link>
        <Link
          href="/legal/seller-terms"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Conditions Vendeurs
        </Link>
        <Link
          href="/legal/privacy"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Confidentialité
        </Link>
      </div>

      {/* Contact form */}
      <div className="mt-16">
        <ContactSupport />
      </div>
    </main>
  );
}
