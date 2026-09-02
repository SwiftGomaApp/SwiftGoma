import { Locale } from "@/lib/language";

export type HelpCategoryId =
  | "getting-started"
  | "buying"
  | "selling"
  | "riding"
  | "account"
  | "payments";

export type HelpFaq = {
  id: string;
  question: Record<Locale, string>;
  answer: Record<Locale, string>;
};

export type HelpCategory = {
  id: HelpCategoryId;
  icon: "rocket" | "shopping-bag" | "store" | "bike" | "shield" | "wallet";
  label: Record<Locale, string>;
  description: Record<Locale, string>;
  faqs: HelpFaq[];
};

export const HELP_STRINGS = {
  en: {
    eyebrow: "Help Center",
    title: "How can we help?",
    subtitle:
      "Answers for Buyers, Sellers, and Riders using Swiftgoma in Goma — plus your account, payments, and orders.",
    searchPlaceholder: "Search for a topic (e.g. QR code, KYC, payout)",
    noResultsTitle: "No matching questions",
    noResultsBody:
      "Try a different search term, or send us a message below and we'll help directly.",
    stillNeedHelp: "Still need help?",
    stillNeedHelpBody:
      "Can't find what you're looking for? Send our support team a message and we'll reply by email.",
    contactCta: "Contact support",
    browseLegal: "Read our Terms & Policies",
    resultsCount: (n: number) => `${n} result${n === 1 ? "" : "s"}`,
  },
  fr: {
    eyebrow: "Centre d'aide",
    title: "Comment pouvons-nous vous aider ?",
    subtitle:
      "Des réponses pour les Acheteurs, Vendeurs et Livreurs de Swiftgoma à Goma — ainsi que sur votre compte, les paiements et les commandes.",
    searchPlaceholder: "Rechercher un sujet (ex. code QR, KYC, retrait)",
    noResultsTitle: "Aucune question correspondante",
    noResultsBody:
      "Essayez un autre terme de recherche, ou envoyez-nous un message ci-dessous, nous vous aiderons directement.",
    stillNeedHelp: "Besoin d'aide supplémentaire ?",
    stillNeedHelpBody:
      "Vous ne trouvez pas ce que vous cherchez ? Envoyez un message à notre équipe support, nous répondrons par e-mail.",
    contactCta: "Contacter le support",
    browseLegal: "Consulter nos Conditions et Politiques",
    resultsCount: (n: number) => `${n} résultat${n === 1 ? "" : "s"}`,
  },
} as const satisfies Record<Locale, Record<string, unknown>>;

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    icon: "rocket",
    label: { en: "Getting Started", fr: "Premiers pas" },
    description: {
      en: "What Swiftgoma is and how to set up your account.",
      fr: "Ce qu'est Swiftgoma et comment configurer votre compte.",
    },
    faqs: [
      {
        id: "what-is-swiftgoma",
        question: {
          en: "What is Swiftgoma?",
          fr: "Qu'est-ce que Swiftgoma ?",
        },
        answer: {
          en: "Swiftgoma is an online marketplace connecting Buyers, Sellers, and independent delivery Riders in Goma, Democratic Republic of the Congo. Buyers browse Shops and place Orders, Sellers list products and fulfil Orders, and Riders deliver Orders on behalf of the Seller who invited them. Swiftgoma does not charge commission on Orders — our revenue comes from Seller subscriptions and wallet payout fees.",
          fr: "Swiftgoma est une place de marché en ligne qui met en relation Acheteurs, Vendeurs et Livreurs indépendants à Goma, en République démocratique du Congo. Les Acheteurs parcourent les Boutiques et passent des Commandes, les Vendeurs listent des produits et traitent les Commandes, et les Livreurs livrent les Commandes pour le compte du Vendeur qui les a invités. Swiftgoma ne prélève aucune commission sur les Commandes — nos revenus proviennent des abonnements Vendeur et des frais de retrait du portefeuille.",
        },
      },
      {
        id: "roles",
        question: {
          en: "What are the different account types?",
          fr: "Quels sont les différents types de compte ?",
        },
        answer: {
          en: "Swiftgoma has three roles: Buyers browse Shops and place Orders; Sellers create a Shop, list products, and fulfil Orders; Riders are invited by a single Seller to deliver that Seller's Orders. A Rider is never a Swiftgoma employee — their relationship is with the Seller who invited them.",
          fr: "Swiftgoma propose trois rôles : les Acheteurs parcourent les Boutiques et passent des Commandes ; les Vendeurs créent une Boutique, listent des produits et traitent les Commandes ; les Livreurs sont invités par un seul Vendeur pour livrer les Commandes de ce dernier. Un Livreur n'est jamais employé de Swiftgoma — sa relation est avec le Vendeur qui l'a invité.",
        },
      },
      {
        id: "coverage",
        question: {
          en: "Which city does Swiftgoma operate in?",
          fr: "Dans quelle ville Swiftgoma est-elle disponible ?",
        },
        answer: {
          en: "Swiftgoma currently onboards Sellers in Goma only, and all Shop addresses are set to Goma. Buyer and Rider activity is centered on the same area.",
          fr: "Swiftgoma n'accueille actuellement des Vendeurs qu'à Goma, et toutes les adresses de Boutique sont fixées à Goma. L'activité des Acheteurs et des Livreurs est centrée sur la même zone.",
        },
      },
      {
        id: "create-account",
        question: {
          en: "How do I create an account?",
          fr: "Comment créer un compte ?",
        },
        answer: {
          en: "Sign up with an email and password, email with a one-time passcode (OTP), Google sign-in, or a passkey. You can add extra security afterwards, like two-factor authentication (TOTP) with backup codes.",
          fr: "Inscrivez-vous avec un e-mail et un mot de passe, un e-mail avec un code à usage unique (OTP), la connexion Google, ou une clé d'accès (passkey). Vous pouvez ensuite ajouter une sécurité supplémentaire, comme l'authentification à deux facteurs (TOTP) avec des codes de secours.",
        },
      },
      {
        id: "languages",
        question: {
          en: "What languages does Swiftgoma support?",
          fr: "Quelles langues Swiftgoma prend-elle en charge ?",
        },
        answer: {
          en: "Swiftgoma is available in English and French. The app follows your browser or device language automatically, and you can switch at any time.",
          fr: "Swiftgoma est disponible en anglais et en français. L'application suit automatiquement la langue de votre navigateur ou appareil, et vous pouvez la changer à tout moment.",
        },
      },
    ],
  },
  {
    id: "buying",
    icon: "shopping-bag",
    label: { en: "Buying", fr: "Achats" },
    description: {
      en: "Browsing, checkout, payment, and order issues.",
      fr: "Navigation, validation, paiement et litiges de commande.",
    },
    faqs: [
      {
        id: "place-order",
        question: {
          en: "How do I place an order?",
          fr: "Comment passer une commande ?",
        },
        answer: {
          en: "Add products from a single Shop to your Cart — items from different Shops can't be combined into one Order. At checkout, choose delivery or pickup, pick a payment method, and confirm. Your Order is then sent to the Seller for review.",
          fr: "Ajoutez des produits d'une seule Boutique à votre Panier — les articles de différentes Boutiques ne peuvent pas être combinés en une seule Commande. Lors de la validation, choisissez la livraison ou le retrait, sélectionnez un mode de paiement, puis confirmez. Votre Commande est ensuite transmise au Vendeur pour examen.",
        },
      },
      {
        id: "payment-methods",
        question: {
          en: "What payment methods can I use?",
          fr: "Quels moyens de paiement puis-je utiliser ?",
        },
        answer: {
          en: "You can pay cash on delivery, or online through our mobile-money payment partners. Online payments are held in escrow and only released to the Seller once your Order's handoff QR code is scanned and verified.",
          fr: "Vous pouvez payer en espèces à la livraison, ou en ligne via nos partenaires de paiement mobile money. Les paiements en ligne sont conservés en séquestre et ne sont libérés au Vendeur qu'une fois le code QR de remise de votre Commande scanné et vérifié.",
        },
      },
      {
        id: "qr-code",
        question: {
          en: "What is the QR code for at handoff?",
          fr: "À quoi sert le code QR lors de la remise ?",
        },
        answer: {
          en: "Each Order has a QR code shown in your app. The Rider or Seller scans it at delivery or pickup to confirm you received your Order — this also releases the payment to the Seller. Never share this code with anyone other than the person completing your handoff.",
          fr: "Chaque Commande dispose d'un code QR affiché dans votre application. Le Livreur ou le Vendeur le scanne à la livraison ou au retrait pour confirmer que vous avez reçu votre Commande — cela libère aussi le paiement au Vendeur. Ne partagez jamais ce code avec une autre personne que celle qui effectue la remise.",
        },
      },
      {
        id: "cancel-order",
        question: {
          en: "Can I cancel an order after placing it?",
          fr: "Puis-je annuler une commande après l'avoir passée ?",
        },
        answer: {
          en: "You can cancel yourself only while the Order remains in a cancellable status, shown in your Order details. Once it has moved to preparation, pickup, or delivery, it may no longer be cancellable through the app. If a Seller doesn't respond in time, the Order expires automatically and any online payment is released back to you.",
          fr: "Vous pouvez annuler vous-même une Commande uniquement tant qu'elle reste dans un statut le permettant, indiqué dans les détails de la Commande. Une fois passée en préparation, retrait ou livraison, elle peut ne plus être annulable depuis l'application. Si un Vendeur ne répond pas à temps, la Commande expire automatiquement et tout paiement en ligne vous est restitué.",
        },
      },
      {
        id: "order-issue",
        question: {
          en: "My order arrived wrong or incomplete — what do I do?",
          fr: "Ma commande est arrivée incorrecte ou incomplète — que faire ?",
        },
        answer: {
          en: "Message the Seller first through your Order's messaging thread. If the issue isn't resolved, contact Swiftgoma Support using the form at the bottom of this page. Refund and adjustment outcomes are reviewed case by case.",
          fr: "Contactez d'abord le Vendeur via le fil de messagerie de votre Commande. Si le problème n'est pas résolu, contactez le Support Swiftgoma via le formulaire en bas de cette page. Les remboursements et ajustements sont examinés au cas par cas.",
        },
      },
      {
        id: "reviews",
        question: {
          en: "How do product reviews work?",
          fr: "Comment fonctionnent les avis produits ?",
        },
        answer: {
          en: "After a purchase, you can leave a rating and written review reflecting your genuine experience. You can edit or remove your own reviews at any time, but you can't review Products you haven't purchased.",
          fr: "Après un achat, vous pouvez laisser une note et un avis écrit reflétant votre expérience réelle. Vous pouvez modifier ou supprimer vos propres avis à tout moment, mais vous ne pouvez pas évaluer des Produits que vous n'avez pas achetés.",
        },
      },
    ],
  },
  {
    id: "selling",
    icon: "store",
    label: { en: "Selling", fr: "Vente" },
    description: {
      en: "Shop setup, verification, subscriptions, and payouts.",
      fr: "Configuration de la boutique, vérification, abonnements et retraits.",
    },
    faqs: [
      {
        id: "become-seller",
        question: {
          en: "How do I start selling on Swiftgoma?",
          fr: "Comment commencer à vendre sur Swiftgoma ?",
        },
        answer: {
          en: "Create a Seller profile with your business name, description, logo, contact details, and Goma business address. Complete identity and business verification (KYC), then subscribe to a plan to publish your Shop and start listing products.",
          fr: "Créez un profil Vendeur avec le nom de votre entreprise, une description, un logo, vos coordonnées et l'adresse de votre entreprise à Goma. Effectuez la vérification d'identité et d'activité (KYC), puis abonnez-vous à un forfait pour publier votre Boutique et commencer à lister des produits.",
        },
      },
      {
        id: "kyc",
        question: {
          en: "What is KYC and why do I need it?",
          fr: "Qu'est-ce que le KYC et pourquoi est-il nécessaire ?",
        },
        answer: {
          en: "KYC is the identity and business verification every Seller completes before their Shop can be published: a government-issued ID, a selfie for identity matching, proof of address, and — if you provide an RCCM number — the matching RCCM document. It's reviewed first by Support, then by an Admin, who may approve, reject with a reason, or ask for more information.",
          fr: "Le KYC est la vérification d'identité et d'activité que chaque Vendeur doit effectuer avant la publication de sa Boutique : une pièce d'identité officielle, un selfie pour la vérification d'identité, un justificatif de domicile et, si vous fournissez un numéro RCCM, le document RCCM correspondant. Il est examiné d'abord par le Support, puis par un Admin, qui peut approuver, refuser avec un motif, ou demander des informations complémentaires.",
        },
      },
      {
        id: "commission",
        question: {
          en: "Does Swiftgoma take a commission on my sales?",
          fr: "Swiftgoma prélève-t-elle une commission sur mes ventes ?",
        },
        answer: {
          en: "No. Swiftgoma does not charge commission on the value of Orders — you keep 100% of what Buyers pay for products. Our revenue comes only from Seller subscription plans and wallet payout transaction fees.",
          fr: "Non. Swiftgoma ne prélève aucune commission sur la valeur des Commandes — vous conservez 100 % de ce que les Acheteurs paient pour les produits. Nos revenus proviennent uniquement des abonnements Vendeur et des frais de transaction lors des retraits du portefeuille.",
        },
      },
      {
        id: "subscriptions",
        question: {
          en: "How do subscription plans work?",
          fr: "Comment fonctionnent les abonnements ?",
        },
        answer: {
          en: "Selling requires an active subscription (Starter, Business, or Enterprise), billed monthly or yearly. Your plan sets limits on the number of Shops, products, and photos per product. If a renewal fails, your subscription enters a short past-due grace period before your Shop is unpublished.",
          fr: "La vente nécessite un abonnement actif (Starter, Business ou Enterprise), facturé mensuellement ou annuellement. Votre forfait définit des limites sur le nombre de Boutiques, de produits et de photos par produit. En cas d'échec de renouvellement, votre abonnement passe par une courte période de grâce avant que votre Boutique ne soit dépubliée.",
        },
      },
      {
        id: "payouts",
        question: {
          en: "How and when do I get paid?",
          fr: "Comment et quand suis-je payé ?",
        },
        answer: {
          en: "Order proceeds are credited to your Wallet by currency (USD or CDF) once the handoff QR code is scanned and verified. You can then request a payout to a mobile-money number you configure, confirmed with a one-time code and subject to minimum and daily payout limits.",
          fr: "Le produit des Commandes est crédité sur votre Portefeuille par devise (USD ou CDF) une fois le code QR de remise scanné et vérifié. Vous pouvez ensuite demander un retrait vers un numéro mobile money que vous configurez, confirmé par un code à usage unique et soumis à des limites minimales et journalières.",
        },
      },
      {
        id: "invite-riders",
        question: {
          en: "How do I get my orders delivered?",
          fr: "Comment faire livrer mes commandes ?",
        },
        answer: {
          en: "Invite Riders by phone number or email — they confirm the invitation with a one-time code. A Rider you invite is affiliated with your Shop only, and you're responsible for their conduct while fulfilling your Orders, including cash-on-delivery handling.",
          fr: "Invitez des Livreurs par numéro de téléphone ou e-mail — ils confirment l'invitation avec un code à usage unique. Un Livreur que vous invitez est affilié uniquement à votre Boutique, et vous êtes responsable de sa conduite lors du traitement de vos Commandes, y compris la gestion des paiements à la livraison.",
        },
      },
    ],
  },
  {
    id: "riding",
    icon: "bike",
    label: { en: "Delivering", fr: "Livraison" },
    description: {
      en: "For Riders fulfilling Seller orders.",
      fr: "Pour les Livreurs qui traitent les commandes des Vendeurs.",
    },
    faqs: [
      {
        id: "become-rider",
        question: {
          en: "How do I become a Rider?",
          fr: "Comment devenir Livreur ?",
        },
        answer: {
          en: "You can't sign up as a Rider directly — a Seller invites you by phone number or email, and you confirm the invitation with a one-time code. You're then affiliated with that Seller's Shop only, not with Swiftgoma directly.",
          fr: "Vous ne pouvez pas vous inscrire directement en tant que Livreur — un Vendeur vous invite par téléphone ou e-mail, et vous confirmez l'invitation avec un code à usage unique. Vous êtes alors affilié uniquement à la Boutique de ce Vendeur, et non directement à Swiftgoma.",
        },
      },
      {
        id: "rider-employment",
        question: {
          en: "Am I a Swiftgoma employee?",
          fr: "Suis-je un employé de Swiftgoma ?",
        },
        answer: {
          en: "No. Riders are never Swiftgoma employees, contractors, or platform-managed resources. Your pay, schedule, and working arrangement are agreed directly with the Seller who invited you, governed by our Rider Terms & Conditions.",
          fr: "Non. Les Livreurs ne sont jamais employés, contractants ou ressources gérées par Swiftgoma. Votre rémunération, votre planning et vos conditions de travail sont convenus directement avec le Vendeur qui vous a invité, dans le cadre de nos Conditions livreur.",
        },
      },
      {
        id: "rider-orders",
        question: {
          en: "Who assigns me orders to deliver?",
          fr: "Qui m'attribue les commandes à livrer ?",
        },
        answer: {
          en: "Only the Seller who invited you assigns you Orders from their Shop. You won't see or deliver Orders for other Sellers unless they invite you separately.",
          fr: "Seul le Vendeur qui vous a invité vous attribue des Commandes de sa Boutique. Vous ne verrez et ne livrerez pas de Commandes d'autres Vendeurs, sauf s'ils vous invitent séparément.",
        },
      },
      {
        id: "rider-handoff",
        question: {
          en: "How do I confirm a delivery?",
          fr: "Comment confirmer une livraison ?",
        },
        answer: {
          en: "Scan the Buyer's Order QR code at handoff. This confirms the Order reached the Buyer and releases the held payment to the Seller's Wallet. For cash-on-delivery Orders, you're responsible for collecting the correct amount before scanning.",
          fr: "Scannez le code QR de la Commande de l'Acheteur lors de la remise. Cela confirme que la Commande est bien parvenue à l'Acheteur et libère le paiement retenu vers le Portefeuille du Vendeur. Pour les Commandes payées à la livraison, vous êtes responsable de la collecte du montant exact avant de scanner.",
        },
      },
    ],
  },
  {
    id: "account",
    icon: "shield",
    label: { en: "Account & Security", fr: "Compte et sécurité" },
    description: {
      en: "Sign-in, passwords, two-factor auth, and sessions.",
      fr: "Connexion, mots de passe, authentification à deux facteurs et sessions.",
    },
    faqs: [
      {
        id: "sign-in-options",
        question: {
          en: "What ways can I sign in?",
          fr: "Quelles sont les méthodes de connexion disponibles ?",
        },
        answer: {
          en: "Email and password, email with a one-time passcode (OTP), Google sign-in, or a passkey. You can use whichever is fastest for you, and set up more than one.",
          fr: "E-mail et mot de passe, e-mail avec un code à usage unique (OTP), connexion Google, ou clé d'accès (passkey). Vous pouvez utiliser la méthode la plus rapide pour vous, et en configurer plusieurs.",
        },
      },
      {
        id: "two-factor",
        question: {
          en: "Can I add two-factor authentication?",
          fr: "Puis-je activer l'authentification à deux facteurs ?",
        },
        answer: {
          en: "Yes. You can enable TOTP-based two-factor authentication from your account security settings and receive backup codes in case you lose access to your authenticator.",
          fr: "Oui. Vous pouvez activer l'authentification à deux facteurs par TOTP depuis les paramètres de sécurité de votre compte, et recevoir des codes de secours en cas de perte d'accès à votre application d'authentification.",
        },
      },
      {
        id: "passkeys",
        question: {
          en: "What is a passkey and how do I set one up?",
          fr: "Qu'est-ce qu'une clé d'accès (passkey) et comment en configurer une ?",
        },
        answer: {
          en: "A passkey lets you sign in with your device's fingerprint, face recognition, or screen lock instead of a password — it's tied to your device and can't be phished or guessed. Add one from your security settings, and manage or remove your passkeys there at any time.",
          fr: "Une clé d'accès vous permet de vous connecter avec l'empreinte digitale, la reconnaissance faciale ou le verrouillage d'écran de votre appareil, à la place d'un mot de passe — elle est liée à votre appareil et ne peut être ni hameçonnée ni devinée. Ajoutez-en une depuis vos paramètres de sécurité, où vous pouvez aussi gérer ou supprimer vos clés d'accès à tout moment.",
        },
      },
      {
        id: "forgot-password",
        question: {
          en: "I forgot my password or lost access to my account.",
          fr: "J'ai oublié mon mot de passe ou perdu l'accès à mon compte.",
        },
        answer: {
          en: 'Use "Forgot password" on the sign-in page to reset it by email. If you\'ve lost access entirely — for example your phone or authenticator — use the account recovery form so our team can verify and help you regain access.',
          fr: "Utilisez « Mot de passe oublié » sur la page de connexion pour le réinitialiser par e-mail. Si vous avez perdu tout accès — par exemple votre téléphone ou votre application d'authentification — utilisez le formulaire de récupération de compte afin que notre équipe puisse vérifier votre identité et vous aider.",
        },
      },
      {
        id: "sessions",
        question: {
          en: "How do I see or sign out of devices logged into my account?",
          fr: "Comment voir ou déconnecter les appareils connectés à mon compte ?",
        },
        answer: {
          en: "Your account settings list every active session with its device and last-used time. You can revoke a single session or log out of all devices at once if something looks unfamiliar.",
          fr: "Les paramètres de votre compte affichent chaque session active avec son appareil et sa dernière utilisation. Vous pouvez révoquer une session précise ou vous déconnecter de tous les appareils si quelque chose vous semble inhabituel.",
        },
      },
      {
        id: "new-device-alert",
        question: {
          en: "Why did I get an email about a new sign-in?",
          fr: "Pourquoi ai-je reçu un e-mail à propos d'une nouvelle connexion ?",
        },
        answer: {
          en: "We send that alert only when we detect a sign-in from a device or browser we haven't seen on your account before — not on every login. If it was you, no action is needed. If you don't recognize it, use the \"Secure your account\" link in that email, or in your security settings.",
          fr: "Nous envoyons cette alerte uniquement lorsque nous détectons une connexion depuis un appareil ou navigateur que nous n'avons encore jamais vu sur votre compte — pas à chaque connexion. Si c'était vous, aucune action n'est nécessaire. Si vous ne reconnaissez pas cette connexion, utilisez le lien « Sécuriser votre compte » dans cet e-mail, ou dans vos paramètres de sécurité.",
        },
      },
      {
        id: "secure-account",
        question: {
          en: "What should I do if I think someone else accessed my account?",
          fr: "Que faire si je pense qu'une autre personne a accédé à mon compte ?",
        },
        answer: {
          en: 'Use "Secure my account" from your security settings, or the link in any security alert email. This immediately signs you out of every device, removes your password, and removes any two-factor method or passkey on the account — you\'ll set a new password the next time you sign in. It\'s confirmed with a one-time code sent to your email, so only you can trigger it.',
          fr: "Utilisez « Sécuriser mon compte » depuis vos paramètres de sécurité, ou le lien présent dans tout e-mail d'alerte de sécurité. Cela vous déconnecte immédiatement de tous les appareils, supprime votre mot de passe, et supprime toute méthode à deux facteurs ou clé d'accès sur le compte — vous définirez un nouveau mot de passe lors de votre prochaine connexion. Cette action est confirmée par un code à usage unique envoyé par e-mail, afin que vous seul puissiez la déclencher.",
        },
      },
      {
        id: "activity-log",
        question: {
          en: "Can I see a history of security events on my account?",
          fr: "Puis-je consulter l'historique des événements de sécurité de mon compte ?",
        },
        answer: {
          en: "Yes. Your security settings include a full activity log — sign-ins, password changes, two-factor changes, and more — each with a timestamp and, where relevant, the device or location involved.",
          fr: "Oui. Vos paramètres de sécurité incluent un historique complet de l'activité — connexions, changements de mot de passe, modifications de l'authentification à deux facteurs, etc. — chacun avec un horodatage et, le cas échéant, l'appareil ou la localisation concernés.",
        },
      },
      {
        id: "data-safety",
        question: {
          en: "How is my personal data handled?",
          fr: "Comment mes données personnelles sont-elles traitées ?",
        },
        answer: {
          en: "Your account details are handled under our Privacy Policy. Verification (KYC) documents are only accessible to authorized Support and Admin staff and kept only as long as needed for verification and regulatory purposes.",
          fr: "Les informations de votre compte sont traitées conformément à notre Politique de confidentialité. Les documents de vérification (KYC) ne sont accessibles qu'au personnel Support et Admin autorisé, et conservés uniquement le temps nécessaire à la vérification et aux fins réglementaires.",
        },
      },
    ],
  },
  {
    id: "payments",
    icon: "wallet",
    label: { en: "Payments & Fees", fr: "Paiements et frais" },
    description: {
      en: "Escrow, currencies, and how Swiftgoma makes money.",
      fr: "Séquestre, devises, et comment Swiftgoma génère ses revenus.",
    },
    faqs: [
      {
        id: "revenue-model",
        question: {
          en: "How does Swiftgoma make money if there's no commission?",
          fr: "Comment Swiftgoma génère-t-elle des revenus sans commission ?",
        },
        answer: {
          en: "Swiftgoma's revenue comes exclusively from Seller subscription plans and wallet payout transaction fees — never from a cut of what Buyers pay for products.",
          fr: "Les revenus de Swiftgoma proviennent exclusivement des abonnements Vendeur et des frais de transaction sur les retraits du portefeuille — jamais d'un prélèvement sur ce que les Acheteurs paient pour les produits.",
        },
      },
      {
        id: "currencies",
        question: {
          en: "What currencies can I use?",
          fr: "Quelles devises puis-je utiliser ?",
        },
        answer: {
          en: "Prices are shown in USD or CDF depending on the Shop and your selection. Where a conversion is shown for convenience, you're charged the amount in the currency you actually selected at checkout.",
          fr: "Les prix sont affichés en USD ou en CDF selon la Boutique et votre sélection. Lorsqu'une conversion est affichée à titre indicatif, le montant facturé est celui de la devise que vous avez réellement choisie lors de la validation.",
        },
      },
      {
        id: "escrow",
        question: {
          en: "What does it mean that my online payment is held in escrow?",
          fr: "Que signifie que mon paiement en ligne est retenu en séquestre ?",
        },
        answer: {
          en: "For online payments, funds are held by our payment partners rather than sent to the Seller right away. They're released to the Seller's Wallet only once your Order's handoff QR code is scanned and verified — protecting you if an Order never arrives.",
          fr: "Pour les paiements en ligne, les fonds sont retenus par nos partenaires de paiement plutôt que transmis immédiatement au Vendeur. Ils sont libérés vers le Portefeuille du Vendeur uniquement une fois le code QR de remise de votre Commande scanné et vérifié — ce qui vous protège si une Commande n'arrive jamais.",
        },
      },
      {
        id: "failed-payment",
        question: {
          en: "What happens if my order expires or a payment isn't captured?",
          fr: "Que se passe-t-il si ma commande expire ou qu'un paiement n'est pas prélevé ?",
        },
        answer: {
          en: "If a Seller doesn't respond within the review window, the Order expires automatically and any online payment held for it is not captured, or is released back to you.",
          fr: "Si un Vendeur ne répond pas dans le délai d'examen, la Commande expire automatiquement et tout paiement en ligne retenu pour celle-ci n'est pas prélevé, ou vous est restitué.",
        },
      },
    ],
  },
];
