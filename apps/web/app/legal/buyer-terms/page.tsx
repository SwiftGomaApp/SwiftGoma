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

const BUYER_TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Buyer Terms & Conditions",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'These Buyer Terms & Conditions ("Buyer Terms") apply in addition to our general Terms & Conditions and govern your use of Swiftgoma as a Buyer to browse Shops, place Orders, and receive Products from Sellers on the Platform.',
      "By creating an account, adding items to a Cart, or placing an Order, you agree to these Buyer Terms in addition to the general Terms & Conditions. Where these Buyer Terms conflict with the general Terms & Conditions, these Buyer Terms take precedence for matters specific to buying on the Platform.",
    ],
    sections: [
      {
        heading: "1. Your Account",
        paragraphs: [
          "You must create an account to place an Order. You are responsible for keeping your login credentials secure and for all activity that happens under your account, including any two-factor authentication or passkeys you set up. Notify us immediately if you suspect unauthorized access to your account.",
          "You must provide accurate contact details, including a phone number, so Sellers and Riders can reach you about your Orders. You are responsible for keeping this information up to date.",
        ],
      },
      {
        heading: "2. Browsing Shops & Products",
        paragraphs: [
          "Shops and the Products they list are created and maintained by independent Sellers. Swiftgoma does not manufacture, own, or hold inventory for the Products shown on the Platform, and product descriptions, prices, stock levels, and images are the Seller's responsibility.",
          "You may save Products to your Favorites for quick access later. Availability, pricing, and stock can change at any time before you complete an Order, and a Seller may be unable to fulfil an item that appeared available when you added it to your Cart.",
        ],
      },
      {
        heading: "3. Cart & Checkout",
        paragraphs: [
          "Your Cart is organized by Shop — items from different Shops cannot be combined into a single Order. Before placing an Order, you choose a fulfillment method (delivery or pickup) and, for delivery, provide a delivery address or location.",
          "You choose a payment method at checkout: cash on delivery or online payment. The total shown at checkout, including the delivery fee where applicable, is the amount you agree to pay for that Order.",
        ],
      },
      {
        heading: "4. Placing & Confirming an Order",
        paragraphs: [
          "Once you place an Order, it is sent to the Seller for review. A Seller may accept or reject your Order within the review window shown at checkout; if the Seller does not respond in time, the Order may expire automatically and any online payment held for it will not be captured or will be released back to you.",
          "If the Seller rejects your Order, you will be shown the reason where one is provided. You may cancel an Order yourself only while it remains in a status that allows cancellation, as shown in your Order details; Orders that have progressed to preparation, pickup, or delivery may no longer be cancellable through the app.",
        ],
      },
      {
        heading: "5. Payments",
        paragraphs: [
          "For cash-on-delivery Orders, you pay the Rider or Seller directly at handoff in the exact currency and amount shown for your Order. For online payments, your payment is processed by our payment partners and held in escrow until the Order is handed off to you and confirmed.",
          "Order handoff is confirmed using a QR code shown in your app, which the Rider or Seller scans at delivery or pickup. Do not share your Order's QR code with anyone other than the Rider or Seller completing your handoff, as scanning it confirms receipt of your Order and releases payment to the Seller.",
          "Prices are shown in USD or CDF depending on the Shop and your selection. Where a currency conversion is shown for your convenience, the amount charged is the amount in the currency selected at checkout.",
        ],
      },
      {
        heading: "6. Delivery & Pickup",
        paragraphs: [
          "For delivery Orders, a Rider affiliated with the Seller's Shop will bring your Order to the address or location you provided. You are responsible for providing an accurate delivery location and being reasonably available to receive the Order; repeated failed delivery attempts due to an incorrect address or unavailability may result in the Order being cancelled or returned to the Seller.",
          "For pickup Orders, you are responsible for collecting your Order from the Shop's address once it is marked ready. Swiftgoma is not responsible for Orders left uncollected beyond a reasonable time after they are marked ready.",
        ],
      },
      {
        heading: "7. Cancellations, Refunds & Order Issues",
        paragraphs: [
          "If your Order is rejected by the Seller, expires without a response, or is cancelled before handoff, any amount held for an online payment is refunded or released back to you; cash-on-delivery Orders that never reach handoff involve no payment to refund.",
          "If you receive an Order that is missing items, incorrect, or materially different from what you ordered, contact the Seller through in-app Order messages first, and contact Swiftgoma Support if the issue is not resolved. Refund and adjustment outcomes depend on the circumstances of each Order and are handled case by case.",
          "Once you have received and accepted an Order at handoff, it is marked complete and payment is released to the Seller; raising an issue after handoff does not automatically reverse a completed payment, but you may still report it to Support for review.",
        ],
      },
      {
        heading: "8. Communicating About an Order",
        paragraphs: [
          "Each Order has its own messaging thread so you can communicate with the Seller about preparation, substitutions, or delivery details. Keep communication about an Order within this thread where possible, as messages may be used to review disputes.",
        ],
      },
      {
        heading: "9. Product Reviews",
        paragraphs: [
          "After purchasing a Product, you may leave a rating and written review for it. Reviews must reflect your genuine experience with the Product and the Seller; you may not post reviews for Products you have not purchased, misrepresent your experience, or accept anything of value in exchange for a review.",
          "You may edit or remove your own reviews. We may remove a review that violates our Terms & Conditions, including reviews that are abusive, fraudulent, or unrelated to the Product.",
        ],
      },
      {
        heading: "10. Buyer Conduct",
        paragraphs: ["As a Buyer, you agree not to:"],
        bullets: [
          "place Orders you do not intend to pay for or collect, or repeatedly abandon Orders after a Seller has accepted them;",
          "arrange payment for a Swiftgoma Order outside the Platform;",
          "share your Order's QR code with anyone other than the Rider or Seller completing your handoff;",
          "provide false delivery details or misuse the delivery address field to reach an unintended location;",
          "post fake, incentivized, or misleading Product reviews, or manipulate ratings;",
          "harass, threaten, or discriminate against Sellers, Riders, or Swiftgoma staff;",
          "use the Platform for any unlawful purpose or to order restricted or illegal goods.",
        ],
      },
      {
        heading: "11. Account Suspension",
        paragraphs: [
          "We may suspend or terminate your Buyer account where we reasonably believe these Buyer Terms, the general Terms & Conditions, or applicable law have been violated. Where possible, we will provide the reason for the action taken and, where applicable, how to appeal it.",
          "Suspending or closing your account does not cancel obligations already incurred, such as Orders in progress or amounts owed for a completed Order.",
        ],
      },
      {
        heading: "12. Your Data as a Buyer",
        paragraphs: [
          "Your account details, Order history, delivery locations, and payment information are handled in accordance with our Privacy Policy. Order messages and QR handoff data are retained as needed to resolve disputes and for legal and accounting purposes.",
        ],
      },
      {
        heading: "13. Liability",
        paragraphs: [
          "Products are sold by independent Sellers, and Swiftgoma is not the manufacturer or owner of the Products listed on the Platform. Swiftgoma facilitates browsing, ordering, payment, and delivery coordination between Buyers, Sellers, and Riders, but is not responsible for a Seller's product quality, a Rider's conduct, or losses arising from inaccurate listings, except as otherwise stated in our general Terms & Conditions.",
        ],
      },
      {
        heading: "14. Changes to These Buyer Terms",
        paragraphs: [
          'We may update these Buyer Terms from time to time to reflect changes to buyer features or applicable law. We will update the "Last updated" date above and, for material changes, provide additional notice such as an in-app notification or email.',
        ],
      },
      {
        heading: "15. Contact Us",
        paragraphs: [
          "For questions about these Buyer Terms, use the contact form below, write to info@swiftgoma.com, or reach us through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },
  fr: {
    title: "Conditions générales acheteur",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Les présentes Conditions acheteur s'appliquent en complément de nos Conditions générales et régissent votre utilisation de Swiftgoma en tant qu'Acheteur pour parcourir les Boutiques, passer des Commandes et recevoir des Produits auprès des Vendeurs sur la Plateforme.",
      "En créant un compte, en ajoutant des articles à un Panier ou en passant une Commande, vous acceptez les présentes Conditions acheteur en plus des Conditions générales. En cas de conflit entre les présentes Conditions acheteur et les Conditions générales, les présentes Conditions acheteur prévalent pour les questions propres à l'achat sur la Plateforme.",
    ],
    sections: [
      {
        heading: "1. Votre compte",
        paragraphs: [
          "Vous devez créer un compte pour passer une Commande. Vous êtes responsable de la sécurité de vos identifiants de connexion et de toute activité effectuée depuis votre compte, y compris toute authentification à deux facteurs ou clé d'accès que vous configurez. Signalez-nous immédiatement tout accès non autorisé suspecté à votre compte.",
          "Vous devez fournir des coordonnées exactes, y compris un numéro de téléphone, afin que les Vendeurs et les Livreurs puissent vous contacter au sujet de vos Commandes. Vous êtes responsable de la mise à jour de ces informations.",
        ],
      },
      {
        heading: "2. Parcourir les Boutiques et Produits",
        paragraphs: [
          "Les Boutiques et les Produits qu'elles proposent sont créés et gérés par des Vendeurs indépendants. Swiftgoma ne fabrique, ne possède ni ne détient de stock pour les Produits affichés sur la Plateforme, et les descriptions, prix, niveaux de stock et images des produits relèvent de la responsabilité du Vendeur.",
          "Vous pouvez enregistrer des Produits dans vos Favoris pour y accéder rapidement. La disponibilité, le prix et le stock peuvent changer à tout moment avant la validation de votre Commande, et un Vendeur peut être dans l'incapacité de fournir un article qui semblait disponible lorsque vous l'avez ajouté à votre Panier.",
        ],
      },
      {
        heading: "3. Panier & validation de commande",
        paragraphs: [
          "Votre Panier est organisé par Boutique — les articles de différentes Boutiques ne peuvent pas être combinés en une seule Commande. Avant de passer une Commande, vous choisissez un mode d'exécution (livraison ou retrait) et, pour la livraison, indiquez une adresse ou un lieu de livraison.",
          "Vous choisissez un mode de paiement lors de la validation : paiement à la livraison ou paiement en ligne. Le total affiché lors de la validation, y compris les frais de livraison le cas échéant, correspond au montant que vous acceptez de payer pour cette Commande.",
        ],
      },
      {
        heading: "4. Passer et confirmer une commande",
        paragraphs: [
          "Une fois votre Commande passée, elle est transmise au Vendeur pour examen. Un Vendeur peut accepter ou refuser votre Commande dans le délai d'examen indiqué lors de la validation ; si le Vendeur ne répond pas à temps, la Commande peut expirer automatiquement et tout paiement en ligne retenu pour celle-ci ne sera pas prélevé ou vous sera restitué.",
          "Si le Vendeur refuse votre Commande, le motif vous sera communiqué lorsqu'il est fourni. Vous ne pouvez annuler vous-même une Commande que tant qu'elle reste dans un statut le permettant, tel qu'indiqué dans les détails de votre Commande ; les Commandes déjà en préparation, en retrait ou en livraison peuvent ne plus être annulables depuis l'application.",
        ],
      },
      {
        heading: "5. Paiements",
        paragraphs: [
          "Pour les Commandes payées à la livraison, vous payez directement le Livreur ou le Vendeur lors de la remise, dans la devise et le montant exacts indiqués pour votre Commande. Pour les paiements en ligne, votre paiement est traité par nos partenaires de paiement et conservé en séquestre jusqu'à ce que la Commande vous soit remise et confirmée.",
          "La remise de la Commande est confirmée à l'aide d'un code QR affiché dans votre application, que le Livreur ou le Vendeur scanne lors de la livraison ou du retrait. Ne partagez le code QR de votre Commande avec personne d'autre que le Livreur ou le Vendeur effectuant la remise, car son scan confirme la réception de votre Commande et libère le paiement au Vendeur.",
          "Les prix sont affichés en USD ou en CDF selon la Boutique et votre sélection. Lorsqu'une conversion de devise est affichée à titre indicatif, le montant facturé est celui de la devise choisie lors de la validation.",
        ],
      },
      {
        heading: "6. Livraison & retrait",
        paragraphs: [
          "Pour les Commandes avec livraison, un Livreur affilié à la Boutique du Vendeur apportera votre Commande à l'adresse ou au lieu que vous avez indiqué. Vous êtes responsable de fournir un lieu de livraison exact et d'être raisonnablement disponible pour recevoir la Commande ; des tentatives de livraison répétées échouées en raison d'une adresse incorrecte ou de votre indisponibilité peuvent entraîner l'annulation de la Commande ou son retour au Vendeur.",
          "Pour les Commandes avec retrait, vous êtes responsable de récupérer votre Commande à l'adresse de la Boutique une fois qu'elle est marquée prête. Swiftgoma n'est pas responsable des Commandes non récupérées au-delà d'un délai raisonnable après leur mise à disposition.",
        ],
      },
      {
        heading: "7. Annulations, remboursements et litiges de commande",
        paragraphs: [
          "Si votre Commande est refusée par le Vendeur, expire sans réponse, ou est annulée avant la remise, tout montant retenu pour un paiement en ligne vous est remboursé ou restitué ; les Commandes payées à la livraison qui n'atteignent jamais l'étape de remise n'impliquent aucun paiement à rembourser.",
          "Si vous recevez une Commande incomplète, incorrecte ou sensiblement différente de ce que vous avez commandé, contactez d'abord le Vendeur via les messages de Commande dans l'application, puis contactez le Support Swiftgoma si le problème n'est pas résolu. Les remboursements et ajustements dépendent des circonstances de chaque Commande et sont traités au cas par cas.",
          "Une fois que vous avez reçu et accepté une Commande lors de la remise, elle est marquée comme terminée et le paiement est libéré au Vendeur ; signaler un problème après la remise n'annule pas automatiquement un paiement finalisé, mais vous pouvez tout de même le signaler au Support pour examen.",
        ],
      },
      {
        heading: "8. Communiquer au sujet d'une commande",
        paragraphs: [
          "Chaque Commande dispose de son propre fil de messagerie afin que vous puissiez communiquer avec le Vendeur au sujet de la préparation, des substitutions ou des détails de livraison. Dans la mesure du possible, gardez les échanges relatifs à une Commande dans ce fil, car les messages peuvent être utilisés pour examiner d'éventuels litiges.",
        ],
      },
      {
        heading: "9. Avis produits",
        paragraphs: [
          "Après l'achat d'un Produit, vous pouvez laisser une note et un avis écrit. Les avis doivent refléter votre expérience réelle avec le Produit et le Vendeur ; vous ne pouvez pas publier d'avis pour des Produits que vous n'avez pas achetés, dénaturer votre expérience, ni accepter une contrepartie en échange d'un avis.",
          "Vous pouvez modifier ou supprimer vos propres avis. Nous pouvons supprimer un avis qui enfreint nos Conditions générales, y compris les avis abusifs, frauduleux ou sans rapport avec le Produit.",
        ],
      },
      {
        heading: "10. Conduite de l'acheteur",
        paragraphs: ["En tant qu'Acheteur, vous vous engagez à ne pas :"],
        bullets: [
          "passer des Commandes que vous n'avez pas l'intention de payer ou de récupérer, ou abandonner de manière répétée des Commandes déjà acceptées par un Vendeur ;",
          "organiser le paiement d'une Commande Swiftgoma en dehors de la Plateforme ;",
          "partager le code QR de votre Commande avec une personne autre que le Livreur ou le Vendeur effectuant la remise ;",
          "fournir de fausses informations de livraison ou détourner le champ d'adresse de livraison vers un lieu non prévu ;",
          "publier des avis produits faux, incités ou trompeurs, ou manipuler les notes ;",
          "harceler, menacer ou discriminer les Vendeurs, les Livreurs ou le personnel Swiftgoma ;",
          "utiliser la Plateforme à des fins illégales ou pour commander des biens restreints ou illicites.",
        ],
      },
      {
        heading: "11. Suspension de compte",
        paragraphs: [
          "Nous pouvons suspendre ou résilier votre compte Acheteur lorsque nous avons des raisons de croire que les présentes Conditions acheteur, les Conditions générales ou la loi applicable ont été enfreintes. Dans la mesure du possible, nous indiquerons le motif de la mesure prise et, le cas échéant, comment la contester.",
          "La suspension ou la fermeture de votre compte n'annule pas les obligations déjà engagées, telles que des Commandes en cours ou des montants dus pour une Commande finalisée.",
        ],
      },
      {
        heading: "12. Vos données en tant qu'acheteur",
        paragraphs: [
          "Les informations de votre compte, votre historique de Commandes, vos lieux de livraison et vos informations de paiement sont traités conformément à notre Politique de confidentialité. Les messages de Commande et les données de remise par code QR sont conservés dans la mesure nécessaire à la résolution des litiges et à des fins légales et comptables.",
        ],
      },
      {
        heading: "13. Responsabilité",
        paragraphs: [
          "Les Produits sont vendus par des Vendeurs indépendants, et Swiftgoma n'est ni le fabricant ni le propriétaire des Produits proposés sur la Plateforme. Swiftgoma facilite la navigation, la commande, le paiement et la coordination de la livraison entre Acheteurs, Vendeurs et Livreurs, mais n'est pas responsable de la qualité des produits d'un Vendeur, de la conduite d'un Livreur, ou des pertes résultant d'annonces inexactes, sauf disposition contraire de nos Conditions générales.",
        ],
      },
      {
        heading: "14. Modifications des présentes Conditions acheteur",
        paragraphs: [
          "Nous pouvons mettre à jour les présentes Conditions acheteur de temps à autre pour refléter des évolutions des fonctionnalités acheteur ou de la loi applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus et, pour les modifications substantielles, fournirons un avis supplémentaire tel qu'une notification in-app ou un e-mail.",
        ],
      },
      {
        heading: "15. Nous contacter",
        paragraphs: [
          "Pour toute question relative aux présentes Conditions acheteur, utilisez le formulaire de contact ci-dessous, écrivez à info@swiftgoma.com, ou passez par la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function BuyerTermsPage() {
  const locale = await getServerLocale();
  const content = BUYER_TERMS_CONTENT[locale];

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
