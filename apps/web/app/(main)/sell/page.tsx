import Link from "next/link";
import {
  UserPlus,
  Building2,
  ShieldCheck,
  CreditCard,
  Store,
  Rocket,
  Bike,
  Landmark,
  PackagePlus,
  Wallet,
  Ban,
  Truck,
  Headset,
  QrCode,
  ShoppingCart,
  Clock,
  ChefHat,
  PackageCheck,
  CircleDollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingPlans } from "@/components/sell/pricing-plans";
import { getCachedPlans } from "@/lib/api/cached-public";
import type { Plan } from "@/lib/api/routes/public";

const STEPS = [
  {
    icon: UserPlus,
    title: "Créez votre compte vendeur",
    description:
      "Inscrivez-vous sur SwiftGoma avec votre email en choisissant le profil Vendeur.",
  },
  {
    icon: Building2,
    title: "Complétez votre profil vendeur",
    description:
      "Renseignez le nom de votre business, votre description, vos contacts, votre ville et ajoutez votre logo et votre bannière.",
  },
  {
    icon: ShieldCheck,
    title: "Vérifiez votre identité",
    description:
      "Envoyez votre pièce d'identité, un justificatif d'adresse, un selfie et votre registre de commerce (RCCM). Notre équipe vérifie votre dossier avant d'activer votre profil. En cas de refus, vous pouvez soumettre à nouveau.",
  },
  {
    icon: CreditCard,
    title: "Choisissez votre formule",
    description:
      "Souscrivez à une formule et payez Un abonnement actif est nécessaire pour créer votre boutique et vos produits.",
  },
  {
    icon: Store,
    title: "Créez votre boutique",
    description:
      "Donnez un nom à votre boutique, ajoutez une description, vos frais de livraison, votre logo et votre bannière.",
  },
  {
    icon: Rocket,
    title: "Publiez votre boutique",
    description:
      "Une fois publiée, votre boutique devient visible par tous les acheteurs de SwiftGoma.",
  },
  {
    icon: Bike,
    title: "Ajoutez vos livreurs",
    description:
      "Si vous proposez la livraison, créez les comptes de vos livreurs directement depuis votre espace vendeur pour leur assigner des commandes.",
  },
  {
    icon: Landmark,
    title: "Configurez votre portefeuille",
    description:
      "Renseignez votre numéro de retrait, et votre pays. C'est ce qui vous permettra de retirer vos gains plus tard.",
  },
  {
    icon: PackagePlus,
    title: "Ajoutez vos produits",
    description:
      "Ajoutez vos photos, variantes et prix. Le nombre de produits dépend de la formule choisie.",
  },
];

const ORDER_FLOW = [
  {
    icon: ShoppingCart,
    title: "L'acheteur commande",
    description:
      "Le client ajoute vos produits au panier, choisit Livraison ou Retrait, puis un mode de paiement : paiement en ligne ou paiement à la livraison.",
  },
  {
    icon: Clock,
    title: "Vous recevez la commande",
    description:
      "Elle arrive en attente de votre validation. Vous devez l'accepter ou la refuser avant l'expiration du délai, sinon elle expire automatiquement.",
  },
  {
    icon: ChefHat,
    title: "Vous préparez la commande",
    description:
      "Une fois acceptée, la commande passe en préparation dans votre boutique.",
  },
  {
    icon: PackageCheck,
    title: "Prête pour retrait ou livraison",
    description:
      "Marquez la commande comme prête. Pour un retrait, l'acheteur viendra scanner le QR code en boutique. Pour une livraison, assignez-lui un de vos livreurs.",
  },
  {
    icon: Truck,
    title: "Livraison en cours",
    description:
      "Votre livreur récupère la commande, puis part en route vers l'acheteur.",
  },
  {
    icon: QrCode,
    title: "Confirmation par QR code",
    description:
      "À la remise, le livreur (ou vous, pour un retrait) scanne le QR code unique de la commande. Elle passe alors au statut Livrée.",
  },
  {
    icon: Wallet,
    title: "Le paiement est crédité",
    description:
      "Pour les commandes payées en ligne, le montant retenu est immédiatement libéré vers votre Portefeuille dès le scan du QR code.",
  },
  {
    icon: CircleDollarSign,
    title: "Commande terminée et retrait",
    description:
      "Une fois la réception confirmée, la commande passe à Terminée. Retirez vos fonds dans votre Portefeuille dès que le solde minimum est atteint.",
  },
];

const BENEFITS = [
  {
    icon: Ban,
    title: "0% de commission",
    description:
      "SwiftGoma ne prélève aucune commission sur vos ventes. Vous gardez 100% de ce que vous vendez.",
  },
  {
    icon: QrCode,
    title: "Paiement sécurisé",
    description:
      "Les fonds sont retenus jusqu'à la confirmation de livraison par scan QR, puis crédités automatiquement à votre portefeuille.",
  },
  {
    icon: Truck,
    title: "Réseau de livreurs",
    description:
      "Connectez-vous à des livreurs actifs près de chez vous pour livrer vos commandes rapidement.",
  },
  {
    icon: Headset,
    title: "Support dédié",
    description:
      "Notre équipe vous accompagne dans la vérification de votre profil et répond à vos questions au quotidien.",
  },
];

export default async function SellPage() {
  let plans: Plan[] = [];

  try {
    plans = await getCachedPlans();
  } catch (err) {
    console.error("[SellPage] Failed to load plans:", err);
  }

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-20 text-center">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Pour les vendeurs
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Vendez vos produits sur SwiftGoma
          </h1>
          <p className="max-w-2xl text-muted-foreground sm:text-lg">
            Ouvrez votre boutique en ligne, touchez des milliers
            d&apos;acheteurs à Goma et dans les environs, et recevez vos
            paiements en toute sécurité — sans aucune commission sur vos ventes.
          </p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Button size="lg">
              <Link href="/auth/sign-up">Commencer à vendre</Link>
            </Button>
            <Button size="lg" variant="secondary">
              <Link href="/help">Voir la FAQ Vendeurs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Comment vendre sur SwiftGoma
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Quatre étapes simples pour lancer votre boutique.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    Étape {i + 1}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Pourquoi vendre sur SwiftGoma
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={benefit.title}
                  className="flex flex-col gap-3 rounded-xl bg-card p-5 ring-1 ring-foreground/10"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Order flow */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="mb-10 flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Comment se déroule une commande
            </h2>
            <p className="max-w-xl text-muted-foreground">
              De la commande de l&apos;acheteur jusqu&apos;au crédit dans votre
              Portefeuille.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {ORDER_FLOW.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            En cas de refus, d&apos;échec de livraison ou d&apos;annulation,
            l&apos;acheteur est automatiquement remboursé.
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="mb-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Nos formules
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Choisissez la formule adaptée à la taille de votre boutique. Aucune
            commission, quel que soit votre plan.
          </p>
        </div>

        <PricingPlans plans={plans} />
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-5 px-6 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Rejoignez les vendeurs qui utilisent déjà SwiftGoma pour vendre à
            Goma et dans les environs.
          </p>
          <Button size="lg">
            <Link href="/auth/sign-up">Créer mon compte Vendeur</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
