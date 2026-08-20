import { getServerLocale, Locale } from "@/lib/language";

type PrivacySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

type PrivacyContent = {
  title: string;
  lastUpdated: string;
  intro: string[];
  sections: PrivacySection[];
};

const LAST_UPDATED: Record<Locale, string> = {
  en: "August 20, 2026",
  fr: "20 août 2026",
};

const PRIVACY_CONTENT: Record<Locale, PrivacyContent> = {
  en: {
    title: "Privacy Policy",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'This Privacy Policy explains how Swiftgoma collects, uses, shares, and protects personal data when you use the Swiftgoma marketplace — our websites, mobile applications, and related services (together, the "Platform") — as a Buyer, Seller, Rider, or visitor in Goma (Democratic Republic of the Congo) or elsewhere.',
      'Swiftgoma is operated by [Legal entity name, registration number and registered address to be inserted] ("Swiftgoma", "we", "us", "our"), the data controller for the personal data described in this policy.',
      "This policy should be read together with our Terms & Conditions and, for information on tracking technologies used on our websites, our Cookies policy, both available in the sidebar.",
    ],
    sections: [
      {
        heading: "1. Information We Collect",
        paragraphs: [
          "We collect information you provide directly, information generated as you use the Platform, and information from third parties involved in delivering our services.",
        ],
        bullets: [
          "Account information: name, phone number, email address(es), password (stored as a salted hash, never in plain text), profile photo, preferred currency, and role (Buyer, Seller, or Rider).",
          "Authentication data: one-time passcodes, password-reset and account-recovery codes, two-factor authentication (TOTP) secrets — encrypted at rest — and backup codes, and passkey public keys and device metadata. If you sign in with Google, we receive your Google account identifier.",
          "Session and device data: IP address, browser or app user agent, device name, and session timestamps, used to keep your account secure and to show you your active sessions.",
          "Seller verification (KYC) data: a copy of a government-issued ID (national ID, voter's card, or passport), a selfie for identity matching, proof of address, and, where applicable, a business registration number (RCCM) and supporting document.",
          "Rider data: a profile photo and vehicle type, provided by the Rider or the Seller who invited them.",
          "Order and delivery data: items purchased, order value, delivery address, and — where you enable location for delivery — GPS coordinates used to route and confirm a delivery.",
          "Payment and payout data: the amounts, currency, and status of your transactions, and the mobile-money number and provider you register for payouts. We do not store your mobile-money PIN or full payment credentials — these are handled directly by our payment partners (PawaPay and MbiyoPay).",
          "Communications: messages exchanged between a Buyer and a Rider about a delivery, product reviews you post, and messages you send to Support, including through the contact form on this page.",
          "Content you upload: shop branding, product photos, and other images you choose to add to a Shop or listing.",
          "Technical and log data: error and performance data captured through our monitoring tools when the Platform encounters a problem.",
        ],
      },

      {
        heading: "2. How We Use Your Information",
        paragraphs: ["We use personal data to:"],
        bullets: [
          "create and secure your account, authenticate you, and keep your session safe;",
          "operate the marketplace — publish Shops, process Orders, coordinate delivery handoffs, and calculate and release payouts;",
          "verify Seller identity and business registration before a Shop can be published;",
          "send transactional notifications by push, SMS, email, or in-app message (for example, order updates or payout confirmations), based on your notification preferences;",
          "provide customer support and respond to messages sent through the contact form or other support channels;",
          "detect, investigate, and prevent fraud, abuse, and security incidents;",
          "comply with applicable legal, tax, and regulatory obligations in the DRC;",
          "maintain and improve the reliability of the Platform, including diagnosing and fixing technical errors.",
        ],
      },

      {
        heading: "3. Payment Processing",
        paragraphs: [
          "Online payments and payouts are processed by our mobile-money payment partners (currently PawaPay and MbiyoPay). When you pay for an Order online or request a payout, the payment partner processes the transaction and shares transaction status and reference details with us; we do not receive or store your mobile-money PIN.",
        ],
      },

      {
        heading: "4. Location Data",
        paragraphs: [
          "If you provide a delivery address or share your device location to place or fulfill an Order, we use that location — together with our mapping provider (Mapbox) — to display addresses, calculate delivery routes, and confirm a handoff. Riders and the Seller fulfilling an Order can see the delivery location necessary to complete that Order.",
        ],
      },

      {
        heading: "5. How We Share Information",
        paragraphs: [
          "We share personal data only as needed to operate the Platform:",
        ],
        bullets: [
          "With other users, to the extent needed to complete a transaction — for example, a Seller sees a Buyer's delivery address for an Order, and a Rider sees the details needed to complete a delivery.",
          "With service providers who process data on our behalf, including Cloudinary (image and document storage), PawaPay and MbiyoPay (payment processing), Africa's Talking (SMS delivery), Firebase Cloud Messaging and OneSignal (push notifications), our email provider (transactional email), and Sentry (error monitoring).",
          "With our hosting and database providers, who store Platform data on our behalf.",
          "With regulators, tax authorities, or law enforcement where required by applicable law, or to protect the rights, safety, or property of Swiftgoma, our users, or the public.",
          "In connection with a merger, acquisition, or sale of assets, subject to the protections of this policy continuing to apply to your data.",
        ],
      },

      {
        heading: "6. Data Retention",
        paragraphs: [
          "We retain personal data for as long as your account is active and for a reasonable period afterward to comply with legal, tax, accounting, or dispute-resolution obligations — for example, Order and payment records are typically retained longer than session data. KYC documents are retained for as long as required to meet our verification and regulatory obligations. When data is no longer needed for these purposes, we delete or anonymize it.",
        ],
      },

      {
        heading: "7. Data Security",
        paragraphs: [
          "We apply technical and organizational measures to protect personal data, including password hashing, encrypted storage of two-factor authentication secrets, support for passkeys and two-factor authentication, session and device visibility so you can review and revoke access, and rate limiting on sensitive endpoints. No system is completely secure, and we encourage you to use a strong, unique password and enable two-factor authentication or a passkey.",
        ],
      },

      {
        heading: "8. Your Rights & Choices",
        paragraphs: [
          "Depending on your location, you may have rights to access, correct, or delete your personal data, object to or restrict certain processing, or request a copy of your data. You can exercise many of these directly in the Platform:",
        ],
        bullets: [
          "update your name, phone number, email, and profile photo from your account settings;",
          "review and revoke active sessions and passkeys from your security settings;",
          "manage which notifications you receive by channel (in-app, email, SMS, push) in your notification preferences;",
          "close your account by contacting Support — see Section 11 of our Terms & Conditions for what closing an account does and does not cancel.",
        ],
      },

      {
        heading: "9. Children's Privacy",
        paragraphs: [
          "The Platform is not directed at, and we do not knowingly collect personal data from, anyone under 18. If we learn that we have collected personal data from a child, we will take reasonable steps to delete it.",
        ],
      },

      {
        heading: "10. Cookies & Similar Technologies",
        paragraphs: [
          "Our websites use cookies and similar technologies, primarily to keep you signed in and to remember your session. For details on the specific cookies we use and how to manage them, see our Cookies policy in the sidebar.",
        ],
      },

      {
        heading: "11. International Data Transfers",
        paragraphs: [
          "Some of our service providers (for example, cloud hosting, database, and image-storage providers) may process data outside the country where you are located. Where this happens, we take reasonable steps to require that these providers protect your data consistently with this policy.",
        ],
      },

      {
        heading: "12. Changes to This Policy",
        paragraphs: [
          'We may update this Privacy Policy from time to time to reflect changes to the Platform or applicable law. We will update the "Last updated" date above and, for material changes, provide additional notice such as an in-app notification or email.',
        ],
      },

      {
        heading: "13. Contact Us",
        paragraphs: [
          "For questions about this policy or to exercise your privacy rights, use the contact form below, email info@swiftgoma.com, or reach out through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },

  fr: {
    title: "Politique de confidentialité",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Cette Politique de confidentialité explique comment Swiftgoma collecte, utilise, partage et protège les données personnelles lorsque vous utilisez la place de marché Swiftgoma — nos sites web, applications mobiles et services associés (ensemble, la « Plateforme ») — en tant qu'Acheteur, Vendeur, Livreur ou visiteur à Goma (République démocratique du Congo) ou ailleurs.",
      "Swiftgoma est exploitée par [nom de l'entité juridique, numéro d'enregistrement et adresse du siège à compléter] (« Swiftgoma », « nous », « notre »), responsable du traitement des données personnelles décrites dans cette politique.",
      "Cette politique doit être lue avec nos Conditions générales et, pour les informations relatives aux technologies de suivi utilisées sur nos sites, notre politique Cookies, toutes deux disponibles dans le menu latéral.",
    ],
    sections: [
      {
        heading: "1. Informations que nous collectons",
        paragraphs: [
          "Nous collectons les informations que vous nous fournissez directement, celles générées lorsque vous utilisez la Plateforme, ainsi que celles provenant de tiers impliqués dans la fourniture de nos services.",
        ],
        bullets: [
          "Informations de compte : nom, numéro de téléphone, adresse(s) e-mail, mot de passe (stocké sous forme de hachage salé, jamais en clair), photo de profil, devise préférée et rôle (Acheteur, Vendeur ou Livreur).",
          "Données d'authentification : codes à usage unique, codes de réinitialisation de mot de passe et de récupération de compte, secrets d'authentification à deux facteurs (TOTP) — chiffrés au repos — et codes de secours, ainsi que les clés publiques et métadonnées d'appareil des passkeys. Si vous vous connectez avec Google, nous recevons votre identifiant de compte Google.",
          "Données de session et d'appareil : adresse IP, user agent du navigateur ou de l'application, nom de l'appareil et horodatages de session, utilisés pour sécuriser votre compte et vous permettre de consulter vos sessions actives.",
          "Données de vérification vendeur (KYC) : une copie d'une pièce d'identité officielle (carte d'identité nationale, carte d'électeur ou passeport), un selfie pour la correspondance d'identité, un justificatif de domicile et, le cas échéant, un numéro d'enregistrement d'entreprise (RCCM) et un document justificatif.",
          "Données livreur : une photo de profil et le type de véhicule, fournis par le Livreur ou le Vendeur qui l'a invité.",
          "Données de commande et de livraison : articles achetés, valeur de la commande, adresse de livraison et, lorsque vous activez la localisation pour la livraison, les coordonnées GPS utilisées pour l'itinéraire et la confirmation de la livraison.",
          "Données de paiement et de retrait : montants, devise et statut de vos transactions, ainsi que le numéro mobile money et l'opérateur enregistrés pour vos retraits. Nous ne stockons pas votre code PIN mobile money ni vos identifiants de paiement complets — ceux-ci sont traités directement par nos partenaires de paiement (PawaPay et MbiyoPay).",
          "Communications : messages échangés entre un Acheteur et un Livreur au sujet d'une livraison, avis produits que vous publiez, et messages que vous envoyez au Support, y compris via le formulaire de contact de cette page.",
          "Contenu que vous téléversez : identité visuelle de la boutique, photos de produits et autres images que vous ajoutez à une Boutique ou une annonce.",
          "Données techniques et journaux : données d'erreur et de performance collectées via nos outils de supervision lorsque la Plateforme rencontre un problème.",
        ],
      },

      {
        heading: "2. Comment nous utilisons vos informations",
        paragraphs: ["Nous utilisons les données personnelles pour :"],
        bullets: [
          "créer et sécuriser votre compte, vous authentifier et protéger votre session ;",
          "faire fonctionner la place de marché — publier les Boutiques, traiter les Commandes, coordonner les remises de livraison, et calculer et libérer les retraits ;",
          "vérifier l'identité et l'enregistrement d'entreprise d'un Vendeur avant la publication d'une Boutique ;",
          "envoyer des notifications transactionnelles par push, SMS, e-mail ou message in-app (par exemple, mises à jour de commande ou confirmations de retrait), selon vos préférences de notification ;",
          "fournir un support client et répondre aux messages envoyés via le formulaire de contact ou d'autres canaux de support ;",
          "détecter, investiguer et prévenir la fraude, les abus et les incidents de sécurité ;",
          "respecter les obligations légales, fiscales et réglementaires applicables en RDC ;",
          "maintenir et améliorer la fiabilité de la Plateforme, y compris le diagnostic et la correction d'erreurs techniques.",
        ],
      },

      {
        heading: "3. Traitement des paiements",
        paragraphs: [
          "Les paiements en ligne et les retraits sont traités par nos partenaires de paiement mobile money (actuellement PawaPay et MbiyoPay). Lorsque vous payez une Commande en ligne ou demandez un retrait, le partenaire de paiement traite la transaction et nous communique son statut et les références associées ; nous ne recevons ni ne stockons votre code PIN mobile money.",
        ],
      },

      {
        heading: "4. Données de localisation",
        paragraphs: [
          "Si vous renseignez une adresse de livraison ou partagez la localisation de votre appareil pour passer ou traiter une Commande, nous utilisons cette localisation — avec notre fournisseur de cartographie (Mapbox) — pour afficher les adresses, calculer les itinéraires de livraison et confirmer une remise. Le Livreur et le Vendeur traitant une Commande peuvent voir la localisation de livraison nécessaire à son exécution.",
        ],
      },

      {
        heading: "5. Comment nous partageons vos informations",
        paragraphs: [
          "Nous ne partageons les données personnelles que dans la mesure nécessaire au fonctionnement de la Plateforme :",
        ],
        bullets: [
          "Avec d'autres utilisateurs, dans la mesure nécessaire à la réalisation d'une transaction — par exemple, un Vendeur voit l'adresse de livraison d'un Acheteur pour une Commande, et un Livreur voit les informations nécessaires pour effectuer une livraison.",
          "Avec des prestataires qui traitent des données pour notre compte, notamment Cloudinary (stockage d'images et de documents), PawaPay et MbiyoPay (traitement des paiements), Africa's Talking (envoi de SMS), Firebase Cloud Messaging et OneSignal (notifications push), notre prestataire d'e-mail (e-mails transactionnels) et Sentry (supervision des erreurs).",
          "Avec nos prestataires d'hébergement et de base de données, qui stockent les données de la Plateforme pour notre compte.",
          "Avec les régulateurs, autorités fiscales ou forces de l'ordre lorsque la loi applicable l'exige, ou pour protéger les droits, la sécurité ou les biens de Swiftgoma, de nos utilisateurs ou du public.",
          "Dans le cadre d'une fusion, acquisition ou cession d'actifs, sous réserve que les protections de cette politique continuent de s'appliquer à vos données.",
        ],
      },

      {
        heading: "6. Conservation des données",
        paragraphs: [
          "Nous conservons les données personnelles aussi longtemps que votre compte est actif, puis pendant une durée raisonnable afin de respecter nos obligations légales, fiscales, comptables ou de résolution de litiges — par exemple, les données de commande et de paiement sont généralement conservées plus longtemps que les données de session. Les documents KYC sont conservés aussi longtemps que nécessaire pour respecter nos obligations de vérification et réglementaires. Lorsque les données ne sont plus nécessaires à ces fins, nous les supprimons ou les anonymisons.",
        ],
      },

      {
        heading: "7. Sécurité des données",
        paragraphs: [
          "Nous appliquons des mesures techniques et organisationnelles pour protéger les données personnelles, notamment le hachage des mots de passe, le chiffrement au repos des secrets d'authentification à deux facteurs, la prise en charge des passkeys et de l'authentification à deux facteurs, la visibilité sur vos sessions et appareils afin que vous puissiez les consulter et les révoquer, ainsi qu'une limitation du taux de requêtes sur les points d'accès sensibles. Aucun système n'est totalement sécurisé, et nous vous encourageons à utiliser un mot de passe fort et unique et à activer l'authentification à deux facteurs ou une passkey.",
        ],
      },

      {
        heading: "8. Vos droits & choix",
        paragraphs: [
          "Selon votre lieu de résidence, vous pouvez disposer de droits d'accès, de rectification ou de suppression de vos données personnelles, d'opposition ou de limitation de certains traitements, ou de demande d'une copie de vos données. Vous pouvez exercer plusieurs de ces droits directement dans la Plateforme :",
        ],
        bullets: [
          "mettre à jour votre nom, numéro de téléphone, e-mail et photo de profil depuis les paramètres de votre compte ;",
          "consulter et révoquer vos sessions actives et vos passkeys depuis les paramètres de sécurité ;",
          "gérer les notifications que vous recevez par canal (in-app, e-mail, SMS, push) dans vos préférences de notification ;",
          "fermer votre compte en contactant le Support — voir la Section 11 de nos Conditions générales pour savoir ce que la fermeture d'un compte annule ou n'annule pas.",
        ],
      },

      {
        heading: "9. Confidentialité des mineurs",
        paragraphs: [
          "La Plateforme ne s'adresse pas aux personnes de moins de 18 ans, et nous ne collectons pas sciemment de données personnelles les concernant. Si nous apprenons avoir collecté des données personnelles d'un mineur, nous prendrons des mesures raisonnables pour les supprimer.",
        ],
      },

      {
        heading: "10. Cookies & technologies similaires",
        paragraphs: [
          "Nos sites web utilisent des cookies et technologies similaires, principalement pour vous maintenir connecté et mémoriser votre session. Pour plus de détails sur les cookies que nous utilisons et la manière de les gérer, consultez notre politique Cookies dans le menu latéral.",
        ],
      },

      {
        heading: "11. Transferts internationaux de données",
        paragraphs: [
          "Certains de nos prestataires (par exemple, les fournisseurs d'hébergement cloud, de base de données et de stockage d'images) peuvent traiter des données en dehors du pays où vous vous trouvez. Le cas échéant, nous prenons des mesures raisonnables pour exiger que ces prestataires protègent vos données conformément à cette politique.",
        ],
      },

      {
        heading: "12. Modifications de cette politique",
        paragraphs: [
          "Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre pour refléter des évolutions de la Plateforme ou de la loi applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus et, pour les modifications substantielles, fournirons un avis supplémentaire tel qu'une notification in-app ou un e-mail.",
        ],
      },

      {
        heading: "13. Nous contacter",
        paragraphs: [
          "Pour toute question relative à cette politique ou pour exercer vos droits en matière de confidentialité, utilisez le formulaire de contact ci-dessous, écrivez à info@swiftgoma.com, ou passez par la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const content = PRIVACY_CONTENT[locale];

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
