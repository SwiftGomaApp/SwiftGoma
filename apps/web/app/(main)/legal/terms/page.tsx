import { LegalDocument } from "../legal-document/legal-document";

export const metadata = {
  title: "Conditions générales d'utilisation",
};

export default function TermsPage() {
  return (
    <LegalDocument
      titleFr="Conditions générales d'utilisation"
      titleEn="Terms & Conditions"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Objet",
          body: [
            "Les présentes Conditions générales d'utilisation (« CGU ») régissent l'accès et l'utilisation de la plateforme Swiftgoma, un marketplace multi-rôles connectant Acheteurs, Vendeurs et Livreurs, accessible via notre site web et nos applications mobiles (ci-après la « Plateforme »).",
            "En créant un compte ou en utilisant la Plateforme de quelque manière que ce soit, vous acceptez d'être lié par les présentes CGU, ainsi que par les conditions spécifiques applicables à votre rôle (Conditions Vendeurs, Conditions Acheteurs ou Conditions Livreurs).",
          ],
        },
        {
          heading: "Définitions",
          body: [
            "« Plateforme » désigne l'ensemble des services Swiftgoma, incluant le site web, les applications mobiles et l'infrastructure back-end.",
            "« Utilisateur » désigne toute personne physique ou morale utilisant la Plateforme, quel que soit son rôle : Acheteur, Vendeur, Livreur ou Administrateur.",
            "« Compte » désigne le profil créé par un Utilisateur pour accéder aux services de la Plateforme.",
            "« Commande » désigne toute transaction d'achat initiée par un Acheteur auprès d'un Vendeur via la Plateforme.",
            "« Portefeuille » (ou « Wallet ») désigne le solde électronique d'un Vendeur sur la Plateforme, alimenté par les ventes et retirable via MbiyoPay.",
          ],
        },
        {
          heading: "Éligibilité et création de compte",
          body: [
            "Vous devez avoir au moins 18 ans, ou l'âge de la majorité légale dans votre juridiction, pour créer un compte sur la Plateforme.",
            "Vous êtes responsable de l'exactitude des informations fournies lors de l'inscription et de la confidentialité de vos identifiants de connexion, y compris toute clé d'accès biométrique ou passkey enregistrée sur votre compte.",
            "Un seul compte est autorisé par personne et par rôle, sauf autorisation explicite de Swiftgoma.",
          ],
        },
        {
          heading: "Rôles sur la Plateforme",
          body: [
            "La Plateforme permet à un même utilisateur d'agir en tant qu'Acheteur, Vendeur ou Livreur, sous réserve de remplir les conditions propres à chaque rôle, décrites dans les documents dédiés (Conditions Vendeurs, Conditions Acheteurs, Conditions Livreurs).",
            "Certains rôles, notamment celui de Vendeur, peuvent nécessiter une vérification d'identité supplémentaire avant activation complète du compte.",
          ],
        },
        {
          heading: "Commandes et transactions",
          body: [
            "Toute Commande passée sur la Plateforme constitue une offre d'achat soumise à l'acceptation du Vendeur concerné.",
            "Les prix affichés sont exprimés dans la devise applicable (USD, CDF) et incluent, sauf mention contraire, les taxes applicables.",
            "Swiftgoma agit en tant qu'intermédiaire technique facilitant la mise en relation entre Acheteurs et Vendeurs, et n'est pas partie au contrat de vente sous-jacent, sauf disposition contraire des présentes.",
          ],
        },
        {
          heading: "Paiements et Portefeuille Vendeur",
          body: [
            "Les paiements effectués sur la Plateforme sont traités via notre partenaire de paiement, MbiyoPay. Swiftgoma ne stocke aucune donnée de carte bancaire ou de compte mobile money.",
            "Les fonds issus des ventes sont crédités au Portefeuille du Vendeur après confirmation de la Commande. Les retraits de fonds sont soumis à une validation par code à usage unique (OTP) et peuvent faire l'objet de frais et de limites journalières selon la devise concernée.",
            "En cas d'échec technique d'un retrait, Swiftgoma effectue jusqu'à trois tentatives automatiques de nouvelle tentative, espacées de quatre heures, avant notification au Vendeur pour action manuelle.",
          ],
        },
        {
          heading: "Obligations des utilisateurs",
          body: [
            "Vous vous engagent à utiliser la Plateforme conformément à la loi applicable et à ne pas publier de contenu illicite, frauduleux, trompeur ou portant atteinte aux droits de tiers.",
            "Il est interdit de contourner les systèmes de paiement de la Plateforme, de créer de fausses transactions, ou de manipuler les systèmes d'évaluation et d'avis.",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          body: [
            "La marque Swiftgoma, son logo, son interface et ses contenus originaux sont la propriété exclusive de Swiftgoma et sont protégés par le droit de la propriété intellectuelle.",
            "Les Vendeurs conservent la propriété des contenus (photos, descriptions) qu'ils publient, mais accordent à Swiftgoma une licence non exclusive d'utilisation aux fins d'exploitation et de promotion de la Plateforme.",
          ],
        },
        {
          heading: "Responsabilité et garanties",
          body: [
            "La Plateforme est fournie « en l'état ». Swiftgoma ne garantit pas une disponibilité ininterrompue du service et ne saurait être tenue responsable des interruptions dues à la maintenance, à des cas de force majeure, ou à des défaillances de tiers (opérateurs de paiement, réseaux mobiles, etc.).",
            "Swiftgoma n'est pas responsable de la qualité, de la conformité ou de la livraison effective des produits vendus par les Vendeurs, sous réserve des mécanismes de médiation et de protection prévus dans les Conditions Acheteurs.",
          ],
        },
        {
          heading: "Suspension et résiliation",
          body: [
            "Swiftgoma se réserve le droit de suspendre ou de résilier tout compte en cas de violation des présentes CGU, de fraude avérée, ou de comportement portant préjudice à d'autres utilisateurs ou à la Plateforme.",
            "Tout Utilisateur peut demander la clôture de son compte à tout moment, sous réserve du règlement des transactions et soldes en cours.",
          ],
        },
        {
          heading: "Modification des CGU",
          body: [
            "Swiftgoma peut modifier les présentes CGU à tout moment. Les Utilisateurs seront informés de toute modification substantielle par notification sur la Plateforme ou par email. La poursuite de l'utilisation de la Plateforme après notification vaut acceptation des nouvelles CGU.",
          ],
        },
        {
          heading: "Droit applicable et juridiction",
          body: [
            "Les présentes CGU sont régies par le droit de la République Démocratique du Congo. Tout litige relatif à leur interprétation ou exécution relève de la compétence exclusive des juridictions de Goma, sauf disposition légale impérative contraire.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative aux présentes CGU, vous pouvez nous contacter à l'adresse : legal@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "Purpose",
          body: [
            'These Terms & Conditions ("Terms") govern access to and use of the Swiftgoma platform, a multi-role marketplace connecting Buyers, Sellers, and Delivery riders, accessible via our website and mobile applications (the "Platform").',
            "By creating an account or using the Platform in any way, you agree to be bound by these Terms, as well as the role-specific terms that apply to you (Seller Terms, Buyer Terms, or Delivery Terms).",
          ],
        },
        {
          heading: "Definitions",
          body: [
            '"Platform" means all Swiftgoma services, including the website, mobile applications, and backend infrastructure.',
            '"User" means any individual or entity using the Platform, regardless of role: Buyer, Seller, Delivery rider, or Administrator.',
            '"Account" means the profile created by a User to access Platform services.',
            '"Order" means any purchase transaction initiated by a Buyer with a Seller through the Platform.',
            '"Wallet" means a Seller\'s electronic balance on the Platform, funded by sales and withdrawable via MbiyoPay.',
          ],
        },
        {
          heading: "Eligibility and account creation",
          body: [
            "You must be at least 18 years old, or the age of legal majority in your jurisdiction, to create an account on the Platform.",
            "You are responsible for the accuracy of the information provided at registration and for keeping your login credentials confidential, including any biometric passkey registered to your account.",
            "Only one account is permitted per person, per role, unless explicitly authorized by Swiftgoma.",
          ],
        },
        {
          heading: "Roles on the Platform",
          body: [
            "The Platform allows the same user to act as a Buyer, Seller, or Delivery rider, subject to meeting the conditions specific to each role, described in the dedicated documents (Seller Terms, Buyer Terms, Delivery Terms).",
            "Certain roles, particularly Seller, may require additional identity verification before the account is fully activated.",
          ],
        },
        {
          heading: "Orders and transactions",
          body: [
            "Any Order placed on the Platform constitutes an offer to purchase, subject to acceptance by the relevant Seller.",
            "Displayed prices are shown in the applicable currency (USD, CDF) and include applicable taxes unless otherwise stated.",
            "Swiftgoma acts as a technical intermediary facilitating the connection between Buyers and Sellers, and is not a party to the underlying sales contract, except as otherwise provided herein.",
          ],
        },
        {
          heading: "Payments and Seller Wallet",
          body: [
            "Payments made on the Platform are processed via our payment partner, MbiyoPay. Swiftgoma does not store any card or mobile money account data.",
            "Funds from sales are credited to the Seller's Wallet after Order confirmation. Withdrawals are subject to one-time-password (OTP) validation and may be subject to fees and daily limits depending on the currency involved.",
            "In the event of a technical withdrawal failure, Swiftgoma performs up to three automatic retries, spaced four hours apart, before notifying the Seller for manual action.",
          ],
        },
        {
          heading: "User obligations",
          body: [
            "You agree to use the Platform in compliance with applicable law and not to post content that is unlawful, fraudulent, misleading, or infringes on third-party rights.",
            "Circumventing the Platform's payment systems, creating fake transactions, or manipulating rating and review systems is prohibited.",
          ],
        },
        {
          heading: "Intellectual property",
          body: [
            "The Swiftgoma brand, logo, interface, and original content are the exclusive property of Swiftgoma and are protected by intellectual property law.",
            "Sellers retain ownership of content (photos, descriptions) they publish, but grant Swiftgoma a non-exclusive license to use it for the purposes of operating and promoting the Platform.",
          ],
        },
        {
          heading: "Liability and warranties",
          body: [
            'The Platform is provided "as is." Swiftgoma does not guarantee uninterrupted availability of the service and is not liable for interruptions due to maintenance, force majeure, or third-party failures (payment operators, mobile networks, etc.).',
            "Swiftgoma is not responsible for the quality, compliance, or actual delivery of products sold by Sellers, subject to the mediation and protection mechanisms set out in the Buyer Terms.",
          ],
        },
        {
          heading: "Suspension and termination",
          body: [
            "Swiftgoma reserves the right to suspend or terminate any account in the event of a breach of these Terms, proven fraud, or conduct harmful to other users or the Platform.",
            "Any User may request account closure at any time, subject to settlement of ongoing transactions and balances.",
          ],
        },
        {
          heading: "Changes to these Terms",
          body: [
            "Swiftgoma may modify these Terms at any time. Users will be notified of any material change via a Platform notification or email. Continued use of the Platform after notification constitutes acceptance of the updated Terms.",
          ],
        },
        {
          heading: "Governing law and jurisdiction",
          body: [
            "These Terms are governed by the law of the Democratic Republic of Congo. Any dispute regarding their interpretation or execution falls under the exclusive jurisdiction of the courts of Goma, unless mandatory law provides otherwise.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding these Terms, you may contact us at: legal@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
