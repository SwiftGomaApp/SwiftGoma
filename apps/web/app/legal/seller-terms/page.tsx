import { getServerLocale, Locale } from "@/lib/language";

type TermsSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type TermsContent = {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: TermsSection[];
};

const LAST_UPDATED: Record<Locale, string> = {
  en: "August 20, 2026",
  fr: "20 août 2026",
};

const SELLER_TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Seller Terms & Conditions",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'These Seller Terms & Conditions ("Seller Terms") apply in addition to our general Terms & Conditions and govern your use of Swiftgoma as a Seller — a business or individual operating a Shop on the Swiftgoma marketplace in Goma, Democratic Republic of the Congo. Swiftgoma currently onboards Sellers in Goma only.',
      "By creating a Seller profile, submitting verification documents, or publishing a Shop, you agree to these Seller Terms in addition to the general Terms & Conditions. Where these Seller Terms conflict with the general Terms & Conditions, these Seller Terms take precedence for matters specific to selling on the Platform.",
    ],
    sections: [
      {
        heading: "1. Seller Profile",
        paragraphs: [
          "To sell on Swiftgoma, you must create a Seller profile with your business name, a description of your business (20–500 characters), a logo and banner image, contact phone number, contact email, WhatsApp number, and a business address in Goma. Your profile starts in Draft status and moves to Active once your identity and business verification (KYC) is approved.",
          "Your profile may only be edited while it is in Draft or Active status, and city is currently limited to Goma. If your profile is Suspended by our Support or Admin team, you will be notified of the reason where possible, and it can be reactivated once the underlying issue is resolved.",
        ],
      },
      {
        heading: "2. Identity & Business Verification (KYC)",
        paragraphs: [
          "Before your Shop can be published, you must submit verification documents: a government-issued ID (national ID, voter's card, or passport), a selfie for identity matching, and proof of address. If you provide a business registration number (RCCM), you must also upload the corresponding RCCM document — the two are required together.",
          "Verification is reviewed in two stages: first by our Support team, then by an Admin, who may approve or reject your submission with a stated reason. If your KYC is rejected, you may correct and resubmit your documents. Providing false, altered, or misleading documents is a violation of these Seller Terms and may result in permanent suspension.",
        ],
      },
      {
        heading: "3. Subscription Plans & Billing",
        paragraphs: [
          "Selling on Swiftgoma requires an active subscription plan (for example, Starter, Business, or Enterprise), billed monthly or yearly in USD or CDF. Each plan defines limits on the number of Shops you may operate, the number of products you may list, and the number of photos per product — you will need to upgrade your plan to exceed these limits.",
          "If a subscription renewal payment fails, your subscription moves to a past-due state with a short grace period to resolve payment before it expires. If your subscription is not active, you will not be able to create a new Shop, and an already-published Shop cannot be republished after being unpublished until your subscription is active again.",
          "You may cancel your subscription at any time; cancellation takes effect at the end of your current billing period rather than immediately, and your subscription remains active until then.",
        ],
      },
      {
        heading: "4. Shops & Products",
        paragraphs: [
          "A Shop must be published before Buyers can see it or place Orders. Publishing, unpublishing, suspending, reactivating, and deleting your own Shop are self-service actions, subject to your plan's Shop limit and an active subscription. A Shop must be unpublished or suspended before it can be deleted.",
          "Products you list must include an accurate name, description (20–1000 characters), price within the supported range for your currency, stock quantity, and unit (piece, kg, liter, or pack). Products in the food & beverage category must include an expiry date. You are responsible for keeping stock levels, prices, and product information accurate and up to date.",
          "Our Support or Admin team may suspend, restore, or — in serious cases — delete a Shop that violates these Seller Terms, the general Terms & Conditions, or applicable law. A Shop suspended by an Admin can only be reactivated by an Admin, even if you are otherwise able to manage your own Shop.",
        ],
      },
      {
        heading: "5. Orders & Fulfillment",
        paragraphs: [
          "When a Buyer places an Order with your Shop, you must accept or reject it within the review window shown in your dashboard (currently 120 minutes); an Order you do not act on in time may expire automatically. Once accepted, you are responsible for preparing the Order and making it available for pickup or delivery.",
          "Swiftgoma does not charge a commission on the value of your Orders — our revenue comes only from your subscription and any wallet payout fees. For Orders paid by cash on delivery, you are responsible for collecting and reconciling the correct amount. For Orders paid online, funds are held in escrow by our payment partners and released to your Wallet once the handoff QR code is scanned and verified.",
          "If you reject an Order, you must provide a reason. Repeated unjustified rejections, failure to fulfil accepted Orders, or providing inaccurate product information may result in a warning, Shop suspension, or termination of your Seller account.",
        ],
      },
      {
        heading: "6. Riders",
        paragraphs: [
          "You may invite riders to deliver Orders from your Shop by sending an invitation to their phone number or email, which they confirm with a one-time code. A Rider you invite is affiliated with your Seller account only, and you are responsible for that Rider's conduct while fulfilling your Orders, including their handling of cash-on-delivery payments and their interactions with Buyers.",
          "Riders are never Swiftgoma employees, contractors, or platform-managed resources. Your relationship with the Riders you invite — including any pay, schedule, or working arrangement — is between you and them, and is also governed by our Rider Terms & Conditions.",
        ],
      },
      {
        heading: "7. Wallet & Payouts",
        paragraphs: [
          "Funds released from escrow, along with any adjustments, are credited to your Wallet by currency (USD or CDF). You may request a payout to a mobile-money number and provider you configure in your payout settings, subject to the minimum payout amount for that currency and to daily payout limits shown in the product at the time of your request.",
          "Payouts require you to confirm a one-time code sent to your registered phone number before they are processed, and may be subject to a payout fee disclosed before you confirm. Refunds and other adjustments are debited from your Wallet in the same manner they were credited.",
        ],
      },
      {
        heading: "8. Product Reviews",
        paragraphs: [
          "Buyers who purchase a product from your Shop may leave a rating and written review. You may not create, edit, or remove reviews of your own products, and you may not offer incentives in exchange for positive reviews. If you believe a review violates our Terms & Conditions, you may report it to Support for review.",
        ],
      },
      {
        heading: "9. Seller Conduct",
        paragraphs: ["As a Seller, you agree not to:"],
        bullets: [
          "list counterfeit, stolen, illegal, unsafe, or restricted goods, or misrepresent a product's condition, origin, or contents;",
          "list a product without a required expiry date where applicable, or misstate stock you do not actually hold;",
          "arrange payment for a Swiftgoma Order outside the Platform to avoid subscription or wallet fees;",
          "submit false or altered identity, business, or RCCM documents during verification;",
          "manipulate reviews, ratings, or order data, including through fake accounts or incentivized reviews;",
          "harass, discriminate against, or mistreat Buyers, Riders, or Swiftgoma staff;",
          "use another Seller's branding, product photos, or listings without authorization.",
        ],
      },
      {
        heading: "10. Suspension & Termination",
        paragraphs: [
          "We may suspend your Seller profile, unpublish or suspend a Shop, or terminate your Seller account where we reasonably believe these Seller Terms, the general Terms & Conditions, or applicable law have been violated. Where possible, we will provide the reason for the action taken and, where your KYC or a Shop suspension can be appealed or corrected, how to do so.",
          "Closing your Seller account does not cancel obligations already incurred, such as Orders in progress, pending payouts, unresolved refunds, or unpaid subscription fees.",
        ],
      },
      {
        heading: "11. Your Data as a Seller",
        paragraphs: [
          "Verification documents, business information, and payout details you provide are handled in accordance with our Privacy Policy. KYC documents in particular are retained only as long as needed for verification and regulatory purposes and are accessible only to authorized Support and Admin staff.",
        ],
      },
      {
        heading: "12. Liability",
        paragraphs: [
          "You are solely responsible for the products you list, the accuracy of your descriptions and pricing, your compliance with applicable laws in the Democratic Republic of the Congo, and your relationship with any Riders you invite. Swiftgoma is not responsible for losses arising from inaccurate listings, product defects, or Rider conduct, except as set out in our general Terms & Conditions.",
        ],
      },
      {
        heading: "13. Changes to These Seller Terms",
        paragraphs: [
          'We may update these Seller Terms from time to time to reflect changes to seller features, plans, or applicable law. We will update the "Last updated" date above and, for material changes, provide additional notice such as an in-app notification or email.',
        ],
      },
      {
        heading: "14. Contact Us",
        paragraphs: [
          "Questions about these Seller Terms can be sent using the contact form below, to info@swiftgoma.com, or through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },
  fr: {
    title: "Conditions vendeur",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Les présentes Conditions vendeur s'appliquent en complément de nos Conditions générales et régissent votre utilisation de Swiftgoma en tant que Vendeur — une entreprise ou un particulier exploitant une Boutique sur la place de marché Swiftgoma à Goma, en République démocratique du Congo. Swiftgoma n'accueille actuellement des Vendeurs qu'à Goma.",
      "En créant un profil Vendeur, en soumettant des documents de vérification ou en publiant une Boutique, vous acceptez les présentes Conditions vendeur en plus des Conditions générales. En cas de conflit entre les présentes Conditions vendeur et les Conditions générales, les présentes Conditions vendeur prévalent pour les sujets propres à la vente sur la Plateforme.",
    ],
    sections: [
      {
        heading: "1. Profil vendeur",
        paragraphs: [
          "Pour vendre sur Swiftgoma, vous devez créer un profil Vendeur comprenant le nom de votre entreprise, une description de votre activité (20 à 500 caractères), un logo et une image de bannière, un numéro de téléphone de contact, une adresse e-mail de contact, un numéro WhatsApp, et une adresse professionnelle à Goma. Votre profil démarre au statut Brouillon et passe au statut Actif une fois votre vérification d'identité et d'activité (KYC) approuvée.",
          "Votre profil ne peut être modifié que lorsqu'il est au statut Brouillon ou Actif, et la ville est actuellement limitée à Goma. Si votre profil est suspendu par notre équipe Support ou Admin, vous serez informé du motif dans la mesure du possible, et il pourra être réactivé une fois le problème résolu.",
        ],
      },
      {
        heading: "2. Vérification d'identité et d'activité (KYC)",
        paragraphs: [
          "Avant que votre Boutique puisse être publiée, vous devez soumettre des documents de vérification : une pièce d'identité officielle (carte d'identité nationale, carte d'électeur ou passeport), un selfie pour la correspondance d'identité, et un justificatif de domicile. Si vous fournissez un numéro d'enregistrement d'entreprise (RCCM), vous devez également téléverser le document RCCM correspondant — les deux sont requis ensemble.",
          "La vérification est examinée en deux étapes : d'abord par notre équipe Support, puis par un Admin, qui peut approuver ou refuser votre dossier avec un motif indiqué. Si votre KYC est refusé, vous pouvez corriger et soumettre à nouveau vos documents. Fournir des documents faux, modifiés ou trompeurs constitue une violation des présentes Conditions vendeur et peut entraîner une suspension définitive.",
        ],
      },
      {
        heading: "3. Abonnements & facturation",
        paragraphs: [
          "La vente sur Swiftgoma nécessite un abonnement actif (par exemple Starter, Business ou Enterprise), facturé mensuellement ou annuellement en USD ou en CDF. Chaque plan définit des limites sur le nombre de Boutiques que vous pouvez exploiter, le nombre de produits que vous pouvez publier et le nombre de photos par produit — vous devrez passer à un plan supérieur pour dépasser ces limites.",
          "Si le paiement de renouvellement d'un abonnement échoue, votre abonnement passe en statut impayé avec un court délai de grâce pour régulariser le paiement avant expiration. Si votre abonnement n'est pas actif, vous ne pourrez pas créer de nouvelle Boutique, et une Boutique déjà publiée ne pourra pas être republiée après avoir été dépubliée tant que votre abonnement n'est pas de nouveau actif.",
          "Vous pouvez annuler votre abonnement à tout moment ; l'annulation prend effet à la fin de votre période de facturation en cours plutôt qu'immédiatement, et votre abonnement reste actif jusque-là.",
        ],
      },
      {
        heading: "4. Boutiques & produits",
        paragraphs: [
          "Une Boutique doit être publiée avant que les Acheteurs puissent la voir ou y passer des Commandes. La publication, la dépublication, la suspension, la réactivation et la suppression de votre propre Boutique sont des actions en libre-service, soumises à la limite de Boutiques de votre plan et à un abonnement actif. Une Boutique doit être dépubliée ou suspendue avant de pouvoir être supprimée.",
          "Les produits que vous publiez doivent comporter un nom exact, une description (20 à 1000 caractères), un prix compris dans la fourchette prise en charge pour votre devise, une quantité en stock et une unité (pièce, kg, litre ou pack). Les produits de la catégorie alimentation et boissons doivent inclure une date d'expiration. Vous êtes responsable de maintenir à jour et exacts vos niveaux de stock, vos prix et les informations sur vos produits.",
          "Notre équipe Support ou Admin peut suspendre, restaurer ou, dans les cas graves, supprimer une Boutique qui enfreint les présentes Conditions vendeur, les Conditions générales ou la loi applicable. Une Boutique suspendue par un Admin ne peut être réactivée que par un Admin, même si vous pouvez par ailleurs gérer votre propre Boutique.",
        ],
      },
      {
        heading: "5. Commandes & traitement",
        paragraphs: [
          "Lorsqu'un Acheteur passe une Commande auprès de votre Boutique, vous devez l'accepter ou la refuser dans le délai d'examen indiqué dans votre tableau de bord (actuellement 120 minutes) ; une Commande sur laquelle vous n'agissez pas à temps peut expirer automatiquement. Une fois acceptée, vous êtes responsable de la préparation de la Commande et de sa mise à disposition pour le retrait ou la livraison.",
          "Swiftgoma ne prélève aucune commission sur la valeur de vos Commandes — nos revenus proviennent uniquement de votre abonnement et d'éventuels frais de retrait du Portefeuille. Pour les Commandes payées à la livraison, vous êtes responsable de la collecte et de la réconciliation du montant exact. Pour les Commandes payées en ligne, les fonds sont conservés en séquestre par nos partenaires de paiement et libérés vers votre Portefeuille dès que le QR code de remise est scanné et vérifié.",
          "Si vous refusez une Commande, vous devez en indiquer le motif. Des refus injustifiés répétés, le non-traitement de Commandes acceptées, ou la fourniture d'informations produit inexactes peuvent entraîner un avertissement, la suspension de votre Boutique ou la résiliation de votre compte Vendeur.",
        ],
      },
      {
        heading: "6. Livreurs",
        paragraphs: [
          "Vous pouvez inviter des livreurs à effectuer les livraisons de votre Boutique en envoyant une invitation à leur numéro de téléphone ou à leur e-mail, qu'ils confirment avec un code à usage unique. Un Livreur que vous invitez est affilié uniquement à votre compte Vendeur, et vous êtes responsable de sa conduite lors du traitement de vos Commandes, y compris la gestion des paiements à la livraison et ses échanges avec les Acheteurs.",
          "Les Livreurs ne sont jamais des employés, prestataires ou ressources gérées par Swiftgoma. Votre relation avec les Livreurs que vous invitez — y compris toute rémunération, tout horaire ou tout arrangement de travail — vous appartient et est également régie par nos Conditions livreur.",
        ],
      },
      {
        heading: "7. Portefeuille & retraits",
        paragraphs: [
          "Les fonds libérés du séquestre, ainsi que tout ajustement, sont crédités à votre Portefeuille par devise (USD ou CDF). Vous pouvez demander un retrait vers un numéro mobile money et un opérateur que vous configurez dans vos paramètres de retrait, sous réserve du montant minimum de retrait pour cette devise et des limites de retrait quotidiennes affichées dans le produit au moment de votre demande.",
          "Les retraits nécessitent la confirmation d'un code à usage unique envoyé à votre numéro de téléphone enregistré avant d'être traités, et peuvent être soumis à des frais de retrait communiqués avant confirmation. Les remboursements et autres ajustements sont débités de votre Portefeuille de la même manière qu'ils y avaient été crédités.",
        ],
      },
      {
        heading: "8. Avis produits",
        paragraphs: [
          "Les Acheteurs ayant acheté un produit dans votre Boutique peuvent laisser une note et un avis écrit. Vous ne pouvez pas créer, modifier ou supprimer les avis sur vos propres produits, ni offrir d'incitations en échange d'avis positifs. Si vous estimez qu'un avis enfreint nos Conditions générales, vous pouvez le signaler au Support pour examen.",
        ],
      },
      {
        heading: "9. Conduite du vendeur",
        paragraphs: ["En tant que Vendeur, vous vous engagez à ne pas :"],
        bullets: [
          "publier des produits contrefaits, volés, illégaux, dangereux ou restreints, ou présenter de façon trompeuse l'état, l'origine ou le contenu d'un produit ;",
          "publier un produit sans la date d'expiration requise le cas échéant, ou déclarer un stock que vous ne détenez pas réellement ;",
          "organiser le paiement d'une Commande Swiftgoma en dehors de la Plateforme afin d'éviter les frais d'abonnement ou de Portefeuille ;",
          "soumettre de faux documents d'identité, d'entreprise ou RCCM, ou des documents modifiés, lors de la vérification ;",
          "manipuler les avis, notes ou données de commande, y compris via de faux comptes ou des avis incités ;",
          "harceler, discriminer ou maltraiter les Acheteurs, les Livreurs ou le personnel Swiftgoma ;",
          "utiliser l'identité visuelle, les photos de produits ou les annonces d'un autre Vendeur sans autorisation.",
        ],
      },
      {
        heading: "10. Suspension & résiliation",
        paragraphs: [
          "Nous pouvons suspendre votre profil Vendeur, dépublier ou suspendre une Boutique, ou résilier votre compte Vendeur lorsque nous avons des raisons de croire que les présentes Conditions vendeur, les Conditions générales ou la loi applicable ont été enfreintes. Dans la mesure du possible, nous indiquerons le motif de la mesure prise et, lorsque votre KYC ou la suspension d'une Boutique peut faire l'objet d'un recours ou d'une correction, comment procéder.",
          "La fermeture de votre compte Vendeur n'annule pas les obligations déjà engagées, telles que des Commandes en cours, des retraits en attente, des remboursements non résolus ou des frais d'abonnement impayés.",
        ],
      },
      {
        heading: "11. Vos données en tant que vendeur",
        paragraphs: [
          "Les documents de vérification, les informations professionnelles et les coordonnées de retrait que vous fournissez sont traités conformément à notre Politique de confidentialité. Les documents KYC en particulier ne sont conservés que le temps nécessaire à la vérification et aux fins réglementaires, et ne sont accessibles qu'au personnel Support et Admin autorisé.",
        ],
      },
      {
        heading: "12. Responsabilité",
        paragraphs: [
          "Vous êtes seul responsable des produits que vous publiez, de l'exactitude de vos descriptions et de vos prix, du respect des lois applicables en République démocratique du Congo, et de votre relation avec les Livreurs que vous invitez. Swiftgoma n'est pas responsable des pertes résultant d'annonces inexactes, de défauts de produits ou de la conduite d'un Livreur, sauf disposition contraire de nos Conditions générales.",
        ],
      },
      {
        heading: "13. Modifications des présentes Conditions vendeur",
        paragraphs: [
          "Nous pouvons mettre à jour les présentes Conditions vendeur de temps à autre pour refléter des évolutions des fonctionnalités vendeur, des plans ou de la loi applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus et, pour les modifications substantielles, fournirons un avis supplémentaire tel qu'une notification in-app ou un e-mail.",
        ],
      },
      {
        heading: "14. Nous contacter",
        paragraphs: [
          "Pour toute question relative aux présentes Conditions vendeur, utilisez le formulaire de contact ci-dessous, écrivez à info@swiftgoma.com, ou passez par la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function SellerTermsPage() {
  const locale = await getServerLocale();
  const content = SELLER_TERMS_CONTENT[locale];

  return (
    <article className="space-y-10">
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {content.title}
        </h1>
        <p className="text-sm text-muted-foreground">{content.lastUpdated}</p>
      </header>

      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        {content.intro.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      {content.sections.map((section) => (
        <section key={section.heading} className="space-y-3 scroll-mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {section.heading}
          </h2>

          {section.paragraphs?.map((paragraph, index) => (
            <p
              key={index}
              className="text-sm leading-relaxed text-muted-foreground"
            >
              {paragraph}
            </p>
          ))}

          {section.bullets && (
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {section.bullets.map((bullet, index) => (
                <li key={index}>{bullet}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
