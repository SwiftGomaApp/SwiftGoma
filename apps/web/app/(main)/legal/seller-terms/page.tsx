import { LegalDocument } from "../legal-document/legal-document";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions Vendeurs",
  description: "Conditions d'utilisation SwiftGoma pour les vendeurs.",
  path: "/legal/seller-terms",
});

export default function SellerTermsPage() {
  return (
    <LegalDocument
      titleFr="Conditions Vendeurs"
      titleEn="Seller Terms"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Champ d'application",
          body: [
            "Les présentes Conditions Vendeurs s'appliquent à toute personne physique ou morale (« Vendeur ») utilisant la Plateforme Swiftgoma pour proposer, vendre et livrer des produits ou services aux Acheteurs. Elles complètent, sans s'y substituer, les Conditions générales d'utilisation de Swiftgoma.",
            "En activant un compte Vendeur, vous acceptez d'être lié par les présentes Conditions Vendeurs, en plus des Conditions générales et de la Politique de confidentialité.",
          ],
        },
        {
          heading: "Vérification et activation du compte Vendeur",
          body: [
            "L'ouverture d'un compte Vendeur nécessite la fourniture d'informations d'identification supplémentaires (pièce d'identité, coordonnées de contact vérifiées, et, le cas échéant, informations relatives à votre activité commerciale).",
            "Swiftgoma se réserve le droit de refuser, suspendre ou retarder l'activation d'un compte Vendeur en cas de doute raisonnable sur l'exactitude des informations fournies ou de non-conformité avec nos critères d'acceptation.",
          ],
        },
        {
          heading: "Fiches produits et annonces",
          body: [
            "Vous êtes seul responsable de l'exactitude, de la légalité et de la conformité des fiches produits que vous publiez, y compris les descriptions, prix, photographies, quantités disponibles et conditions de retour.",
            "Il est strictement interdit de publier des produits contrefaits, illégaux, dangereux, ou dont la vente est réglementée sans les autorisations requises.",
            "Swiftgoma se réserve le droit de retirer toute annonce non conforme, sans préavis, et de suspendre le compte Vendeur associé en cas de récidive.",
          ],
        },
        {
          heading: "Traitement des commandes",
          body: [
            "Vous vous engagez à confirmer et préparer toute Commande reçue dans les délais annoncés sur votre fiche produit ou votre profil boutique.",
            "En cas d'indisponibilité d'un produit commandé, vous devez en informer l'Acheteur et Swiftgoma dans les plus brefs délais afin de permettre l'annulation ou le remboursement de la Commande.",
            "Vous disposez d'un délai maximal d'une (1) journée à compter de la réception d'une Commande pour la confirmer. Passé ce délai sans confirmation de votre part, la Commande est automatiquement annulée et le montant payé par l'Acheteur lui est intégralement remboursé, sans intervention manuelle requise.",
          ],
        },
        {
          heading: "Livraison et Livreurs",
          body: [
            "Le Livreur qui assure la remise d'une Commande à un Acheteur est lié contractuellement au Vendeur, et non à Swiftgoma. Swiftgoma agit uniquement en tant qu'intermédiaire technique facilitant la mise en relation entre le Vendeur et le Livreur via la Plateforme.",
            "En tant que Vendeur, vous êtes responsable du choix, de l'encadrement et de la conduite du ou des Livreurs assurant vos livraisons, ainsi que de la bonne exécution de la livraison de vos Commandes, sous réserve des dispositions spécifiques prévues dans les Conditions Livreurs.",
            "Swiftgoma n'est pas partie à la relation contractuelle entre vous et vos Livreurs et décline toute responsabilité relative à cette relation, sauf disposition légale impérative contraire.",
          ],
        },
        {
          heading: "Portefeuille Vendeur et paiements",
          body: [
            "Chaque Vendeur dispose d'un Portefeuille électronique (« Wallet ») hébergé sur la Plateforme Swiftgoma.",
            "La confirmation de réception d'une Commande s'effectue au moment de la remise physique du colis, par la lecture d'un code QR affiché sur l'application de l'Acheteur, scanné par le Livreur ou le Vendeur assurant la livraison. Cette confirmation est instantanée et ne dépend d'aucune action ultérieure de l'Acheteur.",
            "Les fonds issus d'une vente sont crédités à votre Portefeuille dès cette confirmation par code QR. Avant la remise du colis, les fonds correspondants sont retenus par Swiftgoma à titre de garantie de bonne exécution de la Commande, dans l'intérêt des deux parties.",
            "Le solde du Portefeuille reflète uniquement les fonds effectivement disponibles ; toute tentative de retrait est soumise à une vérification de solde en temps réel afin d'éviter tout découvert.",
            "Les retraits de fonds vers votre compte de paiement (via MbiyoPay) nécessitent une validation par code à usage unique (OTP) envoyé à votre numéro de téléphone enregistré. Aucun retrait automatique ou programmé n'est proposé : votre présence active est requise pour chaque opération de retrait, par mesure de sécurité.",
            "Des limites de retrait journalières s'appliquent selon la devise utilisée (USD, CDF) et peuvent être ajustées par Swiftgoma pour des raisons de conformité ou de gestion des risques.",
            "En cas d'échec technique d'un retrait, Swiftgoma effectue automatiquement jusqu'à trois nouvelles tentatives, espacées de quatre heures, avant de vous notifier avec le motif de l'échec, votre numéro de téléphone masqué associé, et les actions à entreprendre.",
            "Un reçu de paiement est généré pour chaque retrait réussi et disponible dans votre espace Vendeur.",
          ],
        },
        {
          heading: "Commissions et frais d'abonnement",
          body: [
            "Swiftgoma ne prélève aucune commission sur vos ventes. L'intégralité du montant payé par l'Acheteur pour une Commande, hors frais de transaction éventuels liés au retrait, vous revient.",
            "L'accès à la Plateforme en tant que Vendeur peut être soumis à un abonnement payant, selon la formule choisie. Les paiements d'abonnement sont traités via notre partenaire PawaPay, distinct du prestataire utilisé pour les retraits de votre Portefeuille (MbiyoPay).",
            "Des frais de transaction liés au traitement des retraits via MbiyoPay peuvent s'appliquer et sont clairement indiqués avant validation de toute opération de retrait.",
          ],
        },
        {
          heading: "Annulations, retours et litiges",
          body: [
            "Vous vous engagez à traiter les demandes d'annulation, de retour ou de remboursement conformément à votre politique de retour affichée et aux Conditions Acheteurs.",
            "En cas de litige entre un Vendeur et un Acheteur, Swiftgoma peut intervenir en tant que médiateur, sans obligation de résultat, afin de faciliter une résolution équitable.",
          ],
        },
        {
          heading: "Évaluations et réputation",
          body: [
            "Les Acheteurs peuvent laisser des avis et notes concernant vos produits et votre service. Toute tentative de manipulation de ces évaluations (faux avis, incitation à la suppression d'avis négatifs par des moyens détournés) est strictement interdite et peut entraîner la suspension immédiate de votre compte.",
          ],
        },
        {
          heading: "Suspension et résiliation du compte Vendeur",
          body: [
            "Swiftgoma peut suspendre ou résilier votre compte Vendeur en cas de violation des présentes Conditions, de fraude avérée, de taux anormalement élevé de litiges ou d'annulations, ou de tout comportement portant atteinte à la confiance des Acheteurs envers la Plateforme.",
            "En cas de résiliation, tout solde disponible dans votre Portefeuille reste retirable selon la procédure standard, sous réserve de la résolution des litiges ou enquêtes en cours.",
          ],
        },
        {
          heading: "Modification des présentes Conditions",
          body: [
            "Swiftgoma peut modifier les présentes Conditions Vendeurs à tout moment. Les modifications substantielles vous seront notifiées via votre espace Vendeur ou par email avant leur entrée en vigueur.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative à votre compte Vendeur ou aux présentes Conditions, contactez notre équipe dédiée à : sellers@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "Scope",
          body: [
            'These Seller Terms apply to any individual or entity ("Seller") using the Swiftgoma Platform to offer, sell, and deliver products or services to Buyers. They supplement, without replacing, Swiftgoma\'s Terms & Conditions.',
            "By activating a Seller account, you agree to be bound by these Seller Terms, in addition to the Terms & Conditions and Privacy Policy.",
          ],
        },
        {
          heading: "Seller account verification and activation",
          body: [
            "Opening a Seller account requires providing additional identification information (proof of identity, verified contact details, and, where applicable, information regarding your business activity).",
            "Swiftgoma reserves the right to refuse, suspend, or delay activation of a Seller account in the event of reasonable doubt regarding the accuracy of the information provided or non-compliance with our acceptance criteria.",
          ],
        },
        {
          heading: "Product listings",
          body: [
            "You are solely responsible for the accuracy, legality, and compliance of the product listings you publish, including descriptions, prices, photographs, available quantities, and return conditions.",
            "It is strictly prohibited to list counterfeit, illegal, or dangerous products, or products whose sale is regulated, without the required authorizations.",
            "Swiftgoma reserves the right to remove any non-compliant listing without notice, and to suspend the associated Seller account in the event of repeated violations.",
          ],
        },
        {
          heading: "Order processing",
          body: [
            "You agree to confirm and prepare any Order received within the timeframes stated on your product listing or shop profile.",
            "If an ordered product becomes unavailable, you must inform the Buyer and Swiftgoma as soon as possible to allow for cancellation or refund of the Order.",
            "You have a maximum of one (1) day from receipt of an Order to confirm it. If this deadline passes without confirmation on your part, the Order is automatically cancelled and the amount paid by the Buyer is fully refunded to them, with no manual intervention required.",
          ],
        },
        {
          heading: "Delivery and Delivery riders",
          body: [
            "The Delivery rider who hands over an Order to a Buyer is contractually affiliated with the Seller, not with Swiftgoma. Swiftgoma acts solely as a technical intermediary facilitating the connection between the Seller and the Delivery rider through the Platform.",
            "As a Seller, you are responsible for selecting, supervising, and overseeing the conduct of the Delivery rider(s) handling your deliveries, and for the proper fulfillment of delivery for your Orders, subject to the specific provisions set out in the Delivery Terms.",
            "Swiftgoma is not a party to the contractual relationship between you and your Delivery riders and disclaims any liability arising from that relationship, except where mandatory law provides otherwise.",
          ],
        },
        {
          heading: "Seller Wallet and payments",
          body: [
            "Each Seller has an electronic Wallet hosted on the Swiftgoma Platform.",
            "Confirmation of Order receipt takes place at the moment of physical handoff, via a QR code displayed on the Buyer's app and scanned by the Delivery rider or Seller making the delivery. This confirmation is instantaneous and does not depend on any later action by the Buyer.",
            "Funds from a sale are credited to your Wallet as soon as this QR code confirmation occurs. Prior to handoff, the corresponding funds are held by Swiftgoma as a safeguard for the proper fulfillment of the Order, in the interest of both parties.",
            "The Wallet balance reflects only actually available funds; every withdrawal attempt is subject to a real-time balance check to prevent overdraft.",
            "Withdrawals to your payment account (via MbiyoPay) require validation by a one-time password (OTP) sent to your registered phone number. No automatic or scheduled withdrawals are offered: your active presence is required for every withdrawal operation, as a security measure.",
            "Daily withdrawal limits apply depending on the currency used (USD, CDF) and may be adjusted by Swiftgoma for compliance or risk-management reasons.",
            "In the event of a technical withdrawal failure, Swiftgoma automatically performs up to three retries, spaced four hours apart, before notifying you with the failure reason, your associated masked phone number, and the actions to take.",
            "A payment receipt is generated for every successful withdrawal and made available in your Seller dashboard.",
          ],
        },
        {
          heading: "Commissions and subscription fees",
          body: [
            "Swiftgoma does not charge any commission on your sales. The full amount paid by the Buyer for an Order, excluding any transaction fees related to withdrawals, belongs to you.",
            "Access to the Platform as a Seller may be subject to a paid subscription, depending on the plan you choose. Subscription payments are processed via our partner PawaPay, separate from the provider used for Wallet withdrawals (MbiyoPay).",
            "Transaction fees related to withdrawal processing via MbiyoPay may apply and are clearly indicated before any withdrawal operation is confirmed.",
          ],
        },
        {
          heading: "Cancellations, returns, and disputes",
          body: [
            "You agree to handle cancellation, return, or refund requests in accordance with your posted return policy and the Buyer Terms.",
            "In the event of a dispute between a Seller and a Buyer, Swiftgoma may act as mediator, without any obligation of result, to facilitate a fair resolution.",
          ],
        },
        {
          heading: "Ratings and reputation",
          body: [
            "Buyers may leave reviews and ratings regarding your products and service. Any attempt to manipulate these ratings (fake reviews, coercing removal of negative reviews through improper means) is strictly prohibited and may result in immediate account suspension.",
          ],
        },
        {
          heading: "Suspension and termination of Seller account",
          body: [
            "Swiftgoma may suspend or terminate your Seller account in the event of a breach of these Terms, proven fraud, an abnormally high rate of disputes or cancellations, or any conduct undermining Buyer trust in the Platform.",
            "Upon termination, any available Wallet balance remains withdrawable through the standard procedure, subject to resolution of any ongoing disputes or investigations.",
          ],
        },
        {
          heading: "Changes to these Terms",
          body: [
            "Swiftgoma may modify these Seller Terms at any time. Material changes will be notified to you via your Seller dashboard or by email before taking effect.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding your Seller account or these Terms, contact our dedicated team at: sellers@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
