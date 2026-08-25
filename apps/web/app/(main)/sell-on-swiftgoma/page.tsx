import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  PackageCheck,
  QrCode,
  ShieldCheck,
  ShoppingCart,
  Store,
  Truck,
  UserRoundCheck,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getPublicPlans,
  type PublicPlan,
  type PublicPlanPrice,
} from "@/lib/api/routes/plans";
import { getServerLocale } from "@/lib/language";

export const metadata: Metadata = {
  title: "Sell on Swiftgoma | Swiftgoma",
  description:
    "Everything you need to know about selling on Swiftgoma: plans, verification, orders, and delivery.",
};

function formatPlanPrice(price: PublicPlanPrice, locale: "en" | "fr") {
  return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: price.currency,
    maximumFractionDigits: 2,
  }).format(Number(price.amount));
}

function PlanPricing({ plan, locale }: { plan: PublicPlan; locale: "en" | "fr" }) {
  const isFrench = locale === "fr";
  const priceGroups = [
    { cycle: "MONTHLY" as const, label: isFrench ? "Mensuel" : "Monthly" },
    { cycle: "YEARLY" as const, label: isFrench ? "Annuel" : "Yearly" },
  ].map(({ cycle, label }) => ({
    label,
    prices: plan.prices.filter((price) => price.billingCycle === cycle),
  }));

  if (!plan.prices.length) {
    return <p className="mt-4 text-sm text-muted-foreground">{isFrench ? "Prix disponible à l'inscription" : "Price available on sign-up"}</p>;
  }

  return (
    <div className="mt-5 space-y-3">
      {priceGroups.map(({ label, prices }) => prices.length > 0 && (
        <div key={label} className="rounded-xl border bg-muted/30 px-3 py-2.5">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {prices.map((price) => (
              <span key={price.id} className="text-sm font-semibold">
                {formatPlanPrice(price, locale)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{price.currency}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default async function SellOnSwiftgomaPage() {
  const locale = await getServerLocale();
  const plans = await getPublicPlans().catch(() => []);
  const isFrench = locale === "fr";

  const process = [
    { icon: ShoppingCart, title: isFrench ? "Le client commande" : "Buyer checks out", text: isFrench ? "Le client choisit ses produits, son mode de réception et son moyen de paiement." : "The buyer chooses products, fulfilment, and a payment method." },
    { icon: ClipboardCheck, title: isFrench ? "Vous examinez la commande" : "You review the order", text: isFrench ? "Vous acceptez ou refusez la commande selon la disponibilité réelle de vos articles." : "Accept or reject the order based on your real product availability." },
    { icon: PackageCheck, title: isFrench ? "Vous préparez" : "You prepare it", text: isFrench ? "Préparez la commande, puis marquez-la prête pour retrait ou livraison." : "Prepare the order, then mark it ready for pickup or delivery." },
    { icon: Truck, title: isFrench ? "Retrait ou livraison" : "Pickup or delivery", text: isFrench ? "Pour la livraison, vous assignez l'un de vos propres livreurs. Pour le retrait, le client vient à votre boutique." : "For delivery, assign one of your own riders. For pickup, the buyer comes to your shop." },
    { icon: QrCode, title: isFrench ? "Remise confirmée" : "Handoff confirmed", text: isFrench ? "Le code QR unique du client confirme la remise et fait passer la commande à l'étape terminée." : "The buyer’s one-time QR code confirms handoff and completes the order." },
  ];

  const documents = [
    { icon: UserRoundCheck, title: isFrench ? "Pièce d'identité" : "Identity document", text: isFrench ? "Carte nationale, carte d'électeur ou passeport valide." : "A valid national ID, voter card, or passport." },
    { icon: FileText, title: isFrench ? "Justificatif d'adresse" : "Proof of address", text: isFrench ? "Un document clair confirmant votre adresse professionnelle ou personnelle." : "A clear document confirming your business or personal address." },
    { icon: BadgeCheck, title: isFrench ? "Selfie de vérification" : "Verification selfie", text: isFrench ? "Une photo de vous pour confirmer que la pièce d'identité vous appartient." : "A photo of you to confirm that the identity document belongs to you." },
    { icon: Store, title: isFrench ? "RCCM, si applicable" : "RCCM, if applicable", text: isFrench ? "Si vous fournissez un numéro RCCM, joignez également son document justificatif." : "If you provide an RCCM number, include its supporting document as well." },
  ];

  return (
    <main>
      <section className="relative isolate overflow-hidden border-b bg-muted/20">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 -z-10 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <p className="text-sm font-medium text-primary">{isFrench ? "Vendre sur Swiftgoma" : "Sell on Swiftgoma"}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            {isFrench ? "Développez votre activité, sans commission sur vos commandes." : "Grow your business, with no commission on your orders."}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
            {isFrench ? "Swiftgoma vous donne les outils pour présenter vos produits, gérer vos commandes, travailler avec vos livreurs et recevoir vos paiements — dans une expérience pensée pour Goma." : "Swiftgoma gives you the tools to list products, manage orders, work with your riders, and receive payments — in an experience built for Goma."}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button nativeButton={false} render={<Link href="/contact" />} className="h-11 px-5">{isFrench ? "Parler à l'équipe vendeur" : "Talk to seller support"}<ArrowRight className="ml-2 size-4" /></Button>
            <Button variant="outline" nativeButton={false} render={<Link href="#plans" />} className="h-11 px-5">{isFrench ? "Voir les formules" : "View plans"}</Button>
          </div>
          <div className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-3">
            {[isFrench ? "0 % de commission sur les commandes" : "0% order commission", isFrench ? "Vous gardez le contrôle de vos livreurs" : "You manage your own riders", isFrench ? "Validation de remise par QR code" : "QR-verified handoff"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border bg-background/70 px-3 py-3 text-sm font-medium"><Check className="size-4 text-primary" aria-hidden="true" />{item}</div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl"><p className="text-sm font-medium text-primary">{isFrench ? "Vos outils" : "Your tools"}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{isFrench ? "Tout ce qu'il faut pour vendre avec confiance." : "Everything you need to sell with confidence."}</h2></div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[{ icon: Store, title: isFrench ? "Votre vitrine en ligne" : "Your digital storefront", text: isFrench ? "Créez votre boutique, ajoutez des produits, des photos et un stock fiable." : "Create your shop and add products, photos, and reliable stock." }, { icon: Wallet, title: isFrench ? "Des paiements clairs" : "Clear payments", text: isFrench ? "Suivez vos ventes et gérez votre Wallet et vos retraits depuis l'espace vendeur." : "Track sales and manage your Wallet and withdrawals from the seller experience." }, { icon: Truck, title: isFrench ? "Votre livraison, vos règles" : "Your delivery, your rules", text: isFrench ? "Invitez et gérez vos propres livreurs. Vous définissez aussi vos frais de livraison." : "Invite and manage your own riders. You also set your delivery fees." }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border bg-card p-6"><Icon className="size-6 text-primary" aria-hidden="true" /><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}
        </div>
      </section>

      <section className="border-y bg-muted/20"><div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"><div className="max-w-2xl"><p className="text-sm font-medium text-primary">{isFrench ? "Le parcours de commande" : "The order journey"}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{isFrench ? "De la commande du client à la vente terminée." : "From buyer checkout to a completed sale."}</h2><p className="mt-4 text-muted-foreground">{isFrench ? "Chaque étape est visible, ce qui vous aide à préparer, remettre et suivre chaque commande." : "Each step is visible, helping you prepare, hand off, and track every order."}</p></div><ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{process.map(({ icon: Icon, title, text }, index) => <li key={title} className="relative rounded-2xl border bg-card p-5"><span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index + 1}</span><Icon className="mt-5 size-5 text-primary" aria-hidden="true" /><h3 className="mt-3 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></li>)}</ol></div></section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"><div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16"><div><p className="text-sm font-medium text-primary">{isFrench ? "Vérification vendeur" : "Seller verification"}</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">{isFrench ? "Les documents requis, en toute transparence." : "Required documents, clearly explained."}</h2><p className="mt-4 leading-7 text-muted-foreground">{isFrench ? "Avant de soumettre votre dossier, vérifiez votre numéro de téléphone et au moins une adresse e-mail. Nous utilisons ces documents pour vérifier votre profil vendeur et renforcer la confiance sur la marketplace." : "Before submitting, verify your phone number and at least one email address. We use these documents to verify your seller profile and help build trust on the marketplace."}</p><div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-5"><ShieldCheck className="size-5 text-primary" aria-hidden="true" /><p className="mt-3 text-sm leading-6 text-muted-foreground">{isFrench ? "Votre dossier est d'abord examiné par le support, puis approuvé ou refusé par un administrateur. En cas de refus, vous pouvez le corriger et le soumettre à nouveau." : "Support reviews your submission first, then an administrator approves or rejects it. If it is rejected, you can correct and resubmit it."}</p></div></div><div className="grid gap-4 sm:grid-cols-2">{documents.map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl border bg-card p-5"><Icon className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div>)}</div></div></section>

      <section id="plans" className="scroll-mt-20 border-y bg-muted/20">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-medium text-primary">{isFrench ? "Formules vendeur" : "Seller plans"}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">{isFrench ? "Choisissez la formule adaptée à votre activité." : "Choose the plan that fits your business."}</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">{isFrench ? "Comparez les limites de chaque formule et ses prix mensuels ou annuels, dans toutes les devises proposées." : "Compare each plan’s limits and its monthly or yearly price in every available currency."}</p>
          </div>
          {plans.length ? (
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <article key={plan.id} className="flex flex-col rounded-2xl border bg-card p-6">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  <PlanPricing plan={plan} locale={locale} />
                  <div className="mt-6 border-t pt-5">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{isFrench ? "Limites de la formule" : "Plan limits"}</p>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{isFrench ? `Jusqu'à ${plan.maxProducts} produits` : `Up to ${plan.maxProducts} products`}</li>
                      <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{isFrench ? `Jusqu'à ${plan.maxPhotosPerProduct} photos par produit` : `Up to ${plan.maxPhotosPerProduct} photos per product`}</li>
                      <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{isFrench ? `Jusqu'à ${plan.maxShops} boutique(s)` : `Up to ${plan.maxShops} shop(s)`}</li>
                      <li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{plan.prioritySupport ? (isFrench ? "Support prioritaire inclus" : "Priority support included") : (isFrench ? "Support standard inclus" : "Standard support included")}</li>
                    </ul>
                  </div>
                  <Button variant="outline" nativeButton={false} render={<Link href="/contact" />} className="mt-8 w-full">{isFrench ? "Choisir cette formule" : "Choose this plan"}</Button>
                </article>
              ))}
            </div>
          ) : <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-dashed bg-card p-8 text-center"><CreditCard className="mx-auto size-6 text-primary" aria-hidden="true" /><h3 className="mt-4 font-semibold">{isFrench ? "Les formules seront bientôt disponibles." : "Plans will be available soon."}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{isFrench ? "Contactez notre équipe vendeur pour connaître les options disponibles." : "Contact our seller team to learn about the available options."}</p></div>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8"><div className="relative isolate overflow-hidden rounded-3xl bg-primary px-6 py-12 text-center text-primary-foreground sm:px-12 sm:py-16"><div aria-hidden="true" className="absolute -right-16 -top-20 -z-10 size-72 rounded-full bg-white/10 blur-3xl" /><h2 className="text-3xl font-semibold tracking-tight">{isFrench ? "Prêt à faire grandir votre boutique ?" : "Ready to grow your shop?"}</h2><p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-primary-foreground/80 sm:text-base">{isFrench ? "Notre équipe peut vous guider dans les étapes de création de votre profil vendeur et de vérification." : "Our team can guide you through creating your seller profile and completing verification."}</p><Button variant="secondary" nativeButton={false} render={<Link href="/contact" />} className="mt-8">{isFrench ? "Contacter l'équipe vendeur" : "Contact seller support"}<ArrowRight className="ml-2 size-4" /></Button></div></section>
    </main>
  );
}
