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

const TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Terms & Conditions",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'These Terms & Conditions ("Terms") govern access to and use of Swiftgoma, the online marketplace connecting buyers, sellers, and independent delivery riders in Goma (Democratic Republic of the Congo), including the Swiftgoma websites, mobile applications, and related services (together, the "Platform").',
      'Swiftgoma is operated by [Legal entity name, registration number and registered address to be inserted]. In these Terms, "Swiftgoma", "we", "us" and "our" refer to that operating entity.',
      "By creating an account, browsing a shop, placing an order, or otherwise using the Platform, you agree to be bound by these Terms and by our Privacy Policy. If you do not agree, please do not use the Platform.",
      "Sellers, buyers, and riders are additionally bound by the role-specific terms available in the sidebar (Seller Terms & Conditions, Buyer Terms & Conditions, and Rider Terms & Conditions). Where those role-specific terms conflict with this general document, the role-specific terms take precedence for matters they specifically address.",
    ],
    sections: [
      {
        heading: "1. Definitions",
        bullets: [
          '"Platform" means the Swiftgoma website, mobile apps, and API-driven services.',
          '"Account" means a registered user profile on the Platform, held by a Buyer, Seller, Rider, or Swiftgoma staff member (Admin, Support, or Accountant).',
          '"Shop" means a storefront created and managed by a Seller on the Platform.',
          '"Order" means a purchase request placed by a Buyer for one or more products from a Shop.',
          '"Escrow" means the temporary holding of an online payment by our payment partners until the conditions for release described in Section 6 are met.',
          '"Wallet" means the in-app balance in which a Seller\'s order proceeds and payouts are tracked, by currency.',
          '"KYC" means the identity- and business-verification checks Sellers must complete before activating a Shop.',
        ],
      },
      {
        heading: "2. Eligibility & Account Registration",
        paragraphs: [
          "You must be at least 18 years old and have the legal capacity to enter into a binding contract in the country where you reside (currently the Democratic Republic of the Congo) to create an account.",
          "You may register using email and password, email and one-time passcode (OTP), Google sign-in, or a passkey, and you may add two-factor authentication (TOTP) with recovery codes for additional security. You are responsible for keeping your login credentials, OTPs, and recovery codes confidential and for all activity that occurs under your account.",
          "You must provide accurate, current information when registering and keep it up to date. We may suspend or terminate accounts that contain false, misleading, or outdated information, or that we reasonably believe have been compromised.",
        ],
      },
      {
        heading: "3. Roles on the Platform",
        paragraphs: ["Swiftgoma operates three types of accounts:"],
        bullets: [
          "Buyers browse Shops, place Orders, and pay by cash on delivery or online payment.",
          "Sellers create and manage a Shop, list products, complete identity and business verification (KYC), fulfill Orders, and manage a subscription plan.",
          "Riders are invited and managed by a single Seller to fulfill deliveries for that Seller's Orders. A Rider is never a Swiftgoma employee, contractor, or platform-managed resource — the relationship between a Rider and the Seller who invited them is governed by the Rider Terms & Conditions and any arrangement between the Rider and that Seller.",
        ],
      },
      {
        heading: "4. Marketplace Role & 0% Commission",
        paragraphs: [
          "Swiftgoma is a marketplace that connects independent Buyers, Sellers, and Riders. Sellers are solely responsible for the products they list, the accuracy of their descriptions, pricing, stock, and their compliance with applicable laws in the Democratic Republic of the Congo.",
          "Swiftgoma does not charge a commission on the value of Orders. Our revenue comes exclusively from Seller subscription plans (Section 5) and wallet payout transaction fees (Section 7). We do not take a cut of what a Buyer pays for products.",
        ],
      },
      {
        heading: "5. Seller Verification (KYC) & Subscriptions",
        paragraphs: [
          "Before a Shop can be published, Sellers must complete a verification process that includes a government-issued ID (national ID, voter's card, or passport), a selfie for identity matching, proof of address, and, where applicable, a business registration number (RCCM) and supporting document. Verification is reviewed by our Support and Admin teams and may be approved, rejected with a stated reason, or returned for additional information.",
          "Selling on Swiftgoma requires an active subscription plan, billed monthly or yearly in the currency and amount shown at checkout. Subscriptions renew automatically until cancelled and may move to a past-due or expired state if a renewal payment fails, which can result in a Shop being unpublished until payment is resolved.",
        ],
      },
      {
        heading: "6. Orders & Payments",
        paragraphs: [
          "Buyers may pay for an Order by cash on delivery or by online payment through our mobile-money payment partners. Prices are shown in the currency configured for the Shop or Buyer's market and converted where necessary using the exchange rates in effect at the time of the transaction.",
          "For online payments, funds are held in escrow by our payment partners rather than released to the Seller immediately. Escrowed funds are released to the Seller's Wallet once the handoff QR code for the Order is scanned and verified, confirming the Order has reached the Buyer or been handed to the assigned Rider, in line with the Order's fulfilment method.",
          "An Order moves through a defined lifecycle from placement to seller review, acceptance, preparation, pickup or delivery, and completion. A Seller may reject an Order before acceptance; either party may be subject to cancellation or expiry rules described in the Buyer and Seller Terms.",
        ],
      },
      {
        heading: "7. Wallet, Payouts & Fees",
        paragraphs: [
          "Order proceeds released from escrow, along with any adjustments, are credited to the Seller's Wallet by currency. Sellers may request a payout to the mobile-money number and provider configured in their payout settings, subject to the applicable minimum payout amount for that currency.",
          "Payouts are processed through our payment partners and may be subject to a payout fee, disclosed before you confirm the payout. Refunds and adjustments are debited from the Wallet in the same manner they were credited.",
        ],
      },
      {
        heading: "8. Cancellations & Refunds",
        paragraphs: [
          "Cancellation windows and conditions depend on the Order's status and fulfilment method and are set out in the Buyer and Seller Terms. Where a refund is warranted — for example, a rejected, cancelled, or undelivered Order paid online — the refund is reviewed and approved by our Support or Admin team before funds are returned to the Buyer's original payment method or the Order's escrow is released back.",
          "If you believe an Order was not fulfilled correctly, contact Support through the Platform or at info@swiftgoma.com with your Order reference as soon as possible so we can investigate.",
        ],
      },
      {
        heading: "9. Product Content & Reviews",
        paragraphs: [
          "Buyers who have purchased a product may leave a rating and a written review. Reviews must reflect a genuine transaction and may not contain hate speech, harassment, unlawful content, or content unrelated to the product or order experience. We may remove reviews that violate these Terms and may take action against accounts that post fraudulent or manipulated reviews.",
        ],
      },
      {
        heading: "10. Prohibited Conduct",
        paragraphs: ["You agree not to:"],
        bullets: [
          "list or attempt to purchase counterfeit, stolen, illegal, or unsafe goods, or goods whose sale is restricted or prohibited under the laws of the Democratic Republic of the Congo;",
          "circumvent the Platform's payment, escrow, or fee mechanisms, including arranging off-platform payment for an Order placed on Swiftgoma to avoid subscription or transaction fees;",
          "misuse the account-recovery, OTP, passkey, or two-factor authentication systems, or attempt to access another user's account without authorization;",
          "submit false KYC documents or misrepresent your identity, business registration, or delivery role;",
          "harass, threaten, or discriminate against another user, including Buyers, Sellers, Riders, or Swiftgoma staff;",
          "scrape, reverse-engineer, or interfere with the Platform's infrastructure, security, or normal operation.",
        ],
      },
      {
        heading: "11. Suspension & Termination",
        paragraphs: [
          "We may suspend or terminate an account, unpublish a Shop, or restrict access to the Platform where we reasonably believe these Terms, applicable law, or the role-specific terms have been violated, or where necessary to protect the Platform, its users, or a third party. Where possible, we will provide the reason for the action taken.",
          "You may close your account at any time by contacting Support. Closing an account does not cancel obligations already incurred, such as pending Orders, unresolved refunds, or unpaid subscription fees.",
        ],
      },
      {
        heading: "12. Intellectual Property",
        paragraphs: [
          "The Swiftgoma name, logo, and Platform software are the property of Swiftgoma and its licensors and may not be used without our prior written permission. Sellers retain ownership of the content they upload (product photos, descriptions, and shop branding) but grant Swiftgoma a licence to host, display, and use that content to operate and promote the Platform.",
        ],
      },
      {
        heading: "13. Disclaimers & Limitation of Liability",
        paragraphs: [
          'The Platform is provided on an "as is" and "as available" basis. While we work to keep the Platform reliable, we do not guarantee uninterrupted or error-free operation, and we are not responsible for the quality, safety, legality, or delivery of products listed by Sellers or for the conduct of Buyers, Sellers, or Riders.',
          "To the maximum extent permitted by applicable law, Swiftgoma's aggregate liability arising out of or relating to your use of the Platform is limited to the fees you paid to Swiftgoma (subscription or transaction fees) in the twelve (12) months preceding the event giving rise to the claim. Nothing in these Terms limits liability that cannot be limited under applicable law.",
        ],
      },
      {
        heading: "14. Privacy",
        paragraphs: [
          "Our collection and use of personal data, including KYC documents and payment information, is described in our Privacy Policy, available in the sidebar. By using the Platform you also agree to that Privacy Policy.",
        ],
      },
      {
        heading: "15. Governing Law & Disputes",
        paragraphs: [
          "These Terms are governed by the laws of the Democratic Republic of the Congo, without regard to conflict-of-law principles. We encourage you to first raise any dispute with our Support team so we can try to resolve it directly; unresolved disputes will be subject to the competent courts of the Democratic Republic of the Congo.",
        ],
      },
      {
        heading: "16. Changes to These Terms",
        paragraphs: [
          'We may update these Terms from time to time to reflect changes to the Platform, our services, or applicable law. We will update the "Last updated" date above and, for material changes, provide additional notice (such as an in-app notification or email). Continued use of the Platform after a change takes effect constitutes acceptance of the revised Terms.',
        ],
      },
      {
        heading: "17. Contact Us",
        paragraphs: [
          "Questions about these Terms can be sent to info@swiftgoma.com or through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },

  fr: {
    title: "Conditions générales",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Les présentes Conditions générales (les « Conditions ») régissent l'accès et l'utilisation de Swiftgoma, la place de marché en ligne qui met en relation acheteurs, vendeurs et livreurs indépendants à Goma (République démocratique du Congo), y compris les sites web, applications mobiles et services associés de Swiftgoma (ensemble, la « Plateforme »).",
      "Swiftgoma est exploitée par [nom de l'entité juridique, numéro d'enregistrement et adresse du siège à compléter]. Dans les présentes Conditions, « Swiftgoma », « nous » et « notre » désignent cette entité exploitante.",
      "En créant un compte, en consultant une boutique, en passant une commande ou en utilisant autrement la Plateforme, vous acceptez d'être lié par les présentes Conditions ainsi que par notre Politique de confidentialité. Si vous n'acceptez pas ces Conditions, veuillez ne pas utiliser la Plateforme.",
      "Les vendeurs, acheteurs et livreurs sont en outre soumis aux conditions spécifiques à leur rôle, disponibles dans le menu latéral (Conditions vendeur, Conditions acheteur et Conditions livreur). En cas de conflit entre ces conditions spécifiques et le présent document général, les conditions spécifiques prévalent pour les sujets qu'elles traitent expressément.",
    ],
    sections: [
      {
        heading: "1. Définitions",
        bullets: [
          "« Plateforme » désigne le site web, les applications mobiles et les services de Swiftgoma.",
          "« Compte » désigne un profil d'utilisateur enregistré sur la Plateforme, détenu par un Acheteur, un Vendeur, un Livreur ou un membre du personnel Swiftgoma (Admin, Support ou Comptable).",
          "« Boutique » désigne une vitrine créée et gérée par un Vendeur sur la Plateforme.",
          "« Commande » désigne une demande d'achat passée par un Acheteur pour un ou plusieurs produits d'une Boutique.",
          "« Séquestre » (escrow) désigne la conservation temporaire d'un paiement en ligne par nos partenaires de paiement jusqu'à ce que les conditions de libération décrites à la Section 6 soient remplies.",
          "« Portefeuille » (wallet) désigne le solde in-app dans lequel sont suivis, par devise, le produit des commandes et les paiements d'un Vendeur.",
          "« KYC » désigne les vérifications d'identité et d'activité qu'un Vendeur doit réaliser avant de pouvoir activer une Boutique.",
        ],
      },
      {
        heading: "2. Éligibilité & création de compte",
        paragraphs: [
          "Vous devez avoir au moins 18 ans et disposer de la capacité juridique nécessaire pour conclure un contrat contraignant dans le pays où vous résidez (actuellement la République démocratique du Congo) pour créer un compte.",
          "Vous pouvez vous inscrire par e-mail et mot de passe, e-mail et code à usage unique (OTP), connexion Google, ou passkey, et vous pouvez ajouter une authentification à deux facteurs (TOTP) avec des codes de récupération pour renforcer la sécurité. Vous êtes responsable de la confidentialité de vos identifiants, codes OTP et codes de récupération, ainsi que de toute activité effectuée depuis votre compte.",
          "Vous devez fournir des informations exactes et à jour lors de votre inscription. Nous pouvons suspendre ou résilier tout compte contenant des informations fausses, trompeuses ou obsolètes, ou que nous avons des raisons de croire compromis.",
        ],
      },
      {
        heading: "3. Rôles sur la Plateforme",
        paragraphs: ["Swiftgoma gère quatre types de comptes :"],
        bullets: [
          "Les Acheteurs consultent les Boutiques, passent des Commandes et paient à la livraison ou en ligne.",
          "Les Vendeurs créent et gèrent une Boutique, mettent des produits en vente, complètent la vérification d'identité et d'activité (KYC), traitent les Commandes et gèrent un abonnement.",
          "Les Livreurs sont invités et gérés par un Vendeur unique pour effectuer les livraisons des Commandes de ce Vendeur. Un Livreur n'est jamais un employé, prestataire ou ressource gérée par Swiftgoma — la relation entre un Livreur et le Vendeur qui l'a invité est régie par les Conditions livreur et tout accord conclu entre le Livreur et ce Vendeur.",
          "Les comptes Admin, Support et Comptable sont des rôles internes au personnel Swiftgoma, utilisés pour exploiter, modérer et assister la Plateforme.",
        ],
      },
      {
        heading: "4. Rôle de place de marché & commission de 0 %",
        paragraphs: [
          "Swiftgoma est une place de marché qui met en relation des Acheteurs, Vendeurs et Livreurs indépendants. Les Vendeurs sont seuls responsables des produits qu'ils publient, de l'exactitude de leurs descriptions, de leurs prix, de leur stock et du respect des lois applicables en République démocratique du Congo.",
          "Swiftgoma ne prélève aucune commission sur la valeur des Commandes. Nos revenus proviennent exclusivement des abonnements Vendeur (Section 5) et des frais sur les transactions de paiement du Portefeuille (Section 7). Nous ne prélevons rien sur ce que l'Acheteur paie pour les produits.",
        ],
      },
      {
        heading: "5. Vérification vendeur (KYC) & abonnements",
        paragraphs: [
          "Avant qu'une Boutique puisse être publiée, le Vendeur doit compléter un processus de vérification comprenant une pièce d'identité officielle (carte d'identité nationale, carte d'électeur ou passeport), un selfie pour la correspondance d'identité, un justificatif de domicile et, le cas échéant, un numéro d'enregistrement d'entreprise (RCCM) et un document justificatif. La vérification est examinée par nos équipes Support et Admin et peut être approuvée, refusée avec un motif indiqué, ou renvoyée pour complément d'information.",
          "La vente sur Swiftgoma nécessite un abonnement actif, facturé mensuellement ou annuellement, dans la devise et au montant indiqués lors du paiement. Les abonnements se renouvellent automatiquement jusqu'à annulation et peuvent passer en statut impayé ou expiré si un renouvellement échoue, ce qui peut entraîner la dépublication de la Boutique jusqu'à régularisation du paiement.",
        ],
      },
      {
        heading: "6. Commandes & paiements",
        paragraphs: [
          "L'Acheteur peut payer une Commande à la livraison ou en ligne via nos partenaires de paiement mobile money. Les prix sont affichés dans la devise configurée pour la Boutique ou le marché de l'Acheteur et convertis, si nécessaire, selon les taux de change en vigueur au moment de la transaction.",
          "Pour les paiements en ligne, les fonds sont conservés en séquestre par nos partenaires de paiement plutôt que d'être versés immédiatement au Vendeur. Les fonds séquestrés sont libérés vers le Portefeuille du Vendeur dès que le QR code de remise de la Commande est scanné et vérifié, confirmant que la Commande est parvenue à l'Acheteur ou a été remise au Livreur assigné, selon le mode de traitement de la Commande.",
          "Une Commande suit un cycle de vie défini : passation, examen par le vendeur, acceptation, préparation, retrait ou livraison, puis finalisation. Un Vendeur peut refuser une Commande avant de l'accepter ; chaque partie peut être soumise aux règles d'annulation ou d'expiration décrites dans les Conditions acheteur et vendeur.",
        ],
      },
      {
        heading: "7. Portefeuille, paiements & frais",
        paragraphs: [
          "Le produit des Commandes libéré du séquestre, ainsi que tout ajustement, est crédité au Portefeuille du Vendeur par devise. Le Vendeur peut demander un retrait vers le numéro mobile money et l'opérateur configurés dans ses paramètres de paiement, sous réserve du montant minimum de retrait applicable à cette devise.",
          "Les retraits sont traités par nos partenaires de paiement et peuvent être soumis à des frais de retrait, communiqués avant confirmation. Les remboursements et ajustements sont débités du Portefeuille de la même manière qu'ils y avaient été crédités.",
        ],
      },
      {
        heading: "8. Annulations & remboursements",
        paragraphs: [
          "Les délais et conditions d'annulation dépendent du statut de la Commande et du mode de traitement, et sont précisés dans les Conditions acheteur et vendeur. Lorsqu'un remboursement est justifié — par exemple pour une Commande refusée, annulée ou non livrée et payée en ligne — il est examiné et approuvé par notre équipe Support ou Admin avant que les fonds ne soient restitués sur le moyen de paiement d'origine de l'Acheteur ou que le séquestre de la Commande ne soit libéré en retour.",
          "Si vous estimez qu'une Commande n'a pas été correctement traitée, contactez le Support via la Plateforme ou à info@swiftgoma.com en précisant la référence de la Commande, dans les meilleurs délais, afin que nous puissions enquêter.",
        ],
      },
      {
        heading: "9. Contenu produit & avis",
        paragraphs: [
          "Un Acheteur ayant effectivement acheté un produit peut laisser une note et un avis écrit. Les avis doivent refléter une transaction réelle et ne doivent contenir ni propos haineux, ni harcèlement, ni contenu illicite, ni contenu sans rapport avec le produit ou l'expérience de commande. Nous pouvons retirer tout avis qui enfreint les présentes Conditions et prendre des mesures contre les comptes publiant des avis frauduleux ou manipulés.",
        ],
      },
      {
        heading: "10. Comportements interdits",
        paragraphs: ["Vous vous engagez à ne pas :"],
        bullets: [
          "publier ou tenter d'acheter des produits contrefaits, volés, illégaux, dangereux, ou dont la vente est restreinte ou interdite par les lois de la République démocratique du Congo ;",
          "contourner les mécanismes de paiement, de séquestre ou de frais de la Plateforme, notamment en organisant un paiement hors plateforme pour une Commande passée sur Swiftgoma afin d'éviter les frais d'abonnement ou de transaction ;",
          "détourner les systèmes de récupération de compte, d'OTP, de passkey ou d'authentification à deux facteurs, ou tenter d'accéder au compte d'un autre utilisateur sans autorisation ;",
          "soumettre de faux documents KYC ou fournir de fausses informations sur votre identité, votre enregistrement d'entreprise ou votre rôle de livraison ;",
          "harceler, menacer ou discriminer un autre utilisateur, qu'il s'agisse d'un Acheteur, d'un Vendeur, d'un Livreur ou d'un membre du personnel Swiftgoma ;",
          "extraire (scraping), rétro-concevoir ou perturber l'infrastructure, la sécurité ou le fonctionnement normal de la Plateforme.",
        ],
      },
      {
        heading: "11. Suspension & résiliation",
        paragraphs: [
          "Nous pouvons suspendre ou résilier un compte, dépublier une Boutique, ou restreindre l'accès à la Plateforme lorsque nous avons des raisons de croire que les présentes Conditions, la loi applicable ou les conditions spécifiques à un rôle ont été enfreintes, ou lorsque cela est nécessaire pour protéger la Plateforme, ses utilisateurs ou un tiers. Dans la mesure du possible, nous indiquerons le motif de la mesure prise.",
          "Vous pouvez fermer votre compte à tout moment en contactant le Support. La fermeture d'un compte n'annule pas les obligations déjà engagées, telles que des Commandes en cours, des remboursements non résolus ou des frais d'abonnement impayés.",
        ],
      },
      {
        heading: "12. Propriété intellectuelle",
        paragraphs: [
          "Le nom Swiftgoma, son logo et le logiciel de la Plateforme sont la propriété de Swiftgoma et de ses concédants et ne peuvent être utilisés sans notre autorisation écrite préalable. Les Vendeurs conservent la propriété du contenu qu'ils publient (photos de produits, descriptions, identité visuelle de la boutique) mais concèdent à Swiftgoma une licence pour héberger, afficher et utiliser ce contenu afin d'exploiter et de promouvoir la Plateforme.",
        ],
      },
      {
        heading: "13. Avertissements & limitation de responsabilité",
        paragraphs: [
          "La Plateforme est fournie « en l'état » et « selon disponibilité ». Bien que nous nous efforcions d'assurer la fiabilité de la Plateforme, nous ne garantissons pas un fonctionnement ininterrompu ou sans erreur, et nous ne sommes pas responsables de la qualité, de la sécurité, de la légalité ou de la livraison des produits publiés par les Vendeurs, ni du comportement des Acheteurs, Vendeurs ou Livreurs.",
          "Dans toute la mesure permise par la loi applicable, la responsabilité globale de Swiftgoma découlant de votre utilisation de la Plateforme est limitée aux frais que vous avez versés à Swiftgoma (frais d'abonnement ou de transaction) au cours des douze (12) mois précédant l'événement à l'origine de la réclamation. Aucune disposition des présentes Conditions ne limite une responsabilité qui ne peut être limitée en vertu de la loi applicable.",
        ],
      },
      {
        heading: "14. Confidentialité",
        paragraphs: [
          "La collecte et l'utilisation de vos données personnelles, y compris les documents KYC et les informations de paiement, sont décrites dans notre Politique de confidentialité, disponible dans le menu latéral. En utilisant la Plateforme, vous acceptez également cette Politique de confidentialité.",
        ],
      },
      {
        heading: "15. Droit applicable & litiges",
        paragraphs: [
          "Les présentes Conditions sont régies par les lois de la République démocratique du Congo, sans égard aux principes de conflit de lois. Nous vous encourageons à soumettre d'abord tout litige à notre équipe Support afin que nous puissions tenter de le résoudre directement ; les litiges non résolus relèveront des tribunaux compétents de la République démocratique du Congo.",
        ],
      },
      {
        heading: "16. Modifications des présentes Conditions",
        paragraphs: [
          "Nous pouvons mettre à jour les présentes Conditions de temps à autre pour refléter des évolutions de la Plateforme, de nos services ou de la loi applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus et, pour les modifications substantielles, fournirons un avis supplémentaire (notification in-app ou e-mail). La poursuite de l'utilisation de la Plateforme après l'entrée en vigueur d'une modification vaut acceptation des Conditions révisées.",
        ],
      },
      {
        heading: "17. Nous contacter",
        paragraphs: [
          "Pour toute question relative aux présentes Conditions, écrivez à info@swiftgoma.com ou passez par la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function TermsPage() {
  const locale = await getServerLocale();
  const content = TERMS_CONTENT[locale];

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
