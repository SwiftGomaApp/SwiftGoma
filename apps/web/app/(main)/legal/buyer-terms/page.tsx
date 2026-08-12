import { LegalDocument } from "../legal-document/legal-document";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions Acheteurs",
  description: "Conditions d'utilisation SwiftGoma pour les acheteurs.",
  path: "/legal/buyer-terms",
});

export default function BuyerTermsPage() {
  return (
    <LegalDocument
      titleFr="Conditions Acheteurs"
      titleEn="Buyer Terms"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Champ d'application",
          body: [
            "Les présentes Conditions Acheteurs s'appliquent à toute personne physique ou morale (« Acheteur ») utilisant la Plateforme Swiftgoma pour rechercher, commander et recevoir des produits ou services auprès de Vendeurs. Elles complètent, sans s'y substituer, les Conditions générales d'utilisation de Swiftgoma.",
            "En passant une Commande sur la Plateforme, vous acceptez d'être lié par les présentes Conditions Acheteurs, en plus des Conditions générales et de la Politique de confidentialité.",
          ],
        },
        {
          heading: "Passation de commande",
          body: [
            "Toute Commande passée sur la Plateforme constitue une offre d'achat soumise à l'acceptation du Vendeur concerné. Le Vendeur dispose d'un délai maximal d'une (1) journée pour confirmer votre Commande.",
            "Si le Vendeur ne confirme pas votre Commande dans ce délai, celle-ci est automatiquement annulée. Si vous aviez payé en ligne, le montant vous est intégralement remboursé sans démarche de votre part ; si vous aviez choisi le paiement à la livraison, aucun montant n'a été prélevé.",
            "Les prix affichés sont exprimés dans la devise applicable (USD, CDF) et incluent, sauf mention contraire, les taxes applicables.",
          ],
        },
        {
          heading: "Modes de paiement",
          body: [
            "Swiftgoma propose deux modes de paiement au moment de la validation de votre Commande :",
            "1. Paiement en ligne, traité via notre partenaire MbiyoPay au moment de la confirmation de la Commande par le Vendeur.",
            "2. Paiement à la livraison (« COD » — Cash on Delivery), qui consiste à régler le montant de votre Commande en espèces directement au Livreur ou au Vendeur au moment de la remise du colis.",
            "Le mode de paiement disponible peut varier selon le Vendeur, la zone de livraison ou le montant de la Commande. Une fois votre Commande validée, le mode de paiement choisi ne peut être modifié.",
          ],
        },
        {
          heading: "Sécurisation de votre paiement",
          body: [
            "Pour les Commandes payées en ligne, le montant est retenu par Swiftgoma à titre de garantie jusqu'à confirmation de la bonne réception du colis, puis reversé au Vendeur. Cela signifie que si votre colis n'est jamais livré, ou si un litige survient avant sa remise, vos fonds n'ont pas encore été versés au Vendeur, ce qui facilite un éventuel remboursement.",
            "Pour les Commandes payées à la livraison, aucun montant n'est prélevé à l'avance : le paiement s'effectue directement entre vous et le Livreur ou le Vendeur au moment de la remise du colis. Ce mode de paiement ne bénéficie pas du mécanisme de garantie décrit ci-dessus, dans la mesure où aucun fonds n'a transité par Swiftgoma avant la livraison.",
          ],
        },
        {
          heading: "Réception de votre commande",
          body: [
            "Au moment de la livraison, un code QR est généré et affiché sur votre application. Vous devez le présenter au Livreur (ou au Vendeur, selon le mode de livraison choisi) afin qu'il le scanne pour confirmer la remise du colis.",
            "Pour les Commandes payées en ligne, cette confirmation par code QR déclenche immédiatement le versement des fonds correspondants au Vendeur ; assurez-vous donc de vérifier le contenu et l'état de votre colis avant de permettre le scan, dans la mesure du possible.",
            "Pour les Commandes payées à la livraison, le paiement en espèces doit être effectué avant ou au moment du scan du code QR, selon les modalités convenues avec le Livreur ou le Vendeur.",
            "En cas d'absence lors de la livraison ou de refus du colis, contactez le Vendeur ou le service client Swiftgoma afin de convenir d'une nouvelle tentative de livraison ou d'un remboursement, selon les modalités prévues par la politique de retour du Vendeur.",
          ],
        },
        {
          heading: "Annulation et remboursement",
          body: [
            "Vous pouvez annuler une Commande tant qu'elle n'a pas été confirmée par le Vendeur, directement depuis votre espace Acheteur.",
            "Une fois la Commande confirmée par le Vendeur, les conditions d'annulation, de retour ou de remboursement applicables sont celles affichées sur la fiche produit ou le profil boutique du Vendeur concerné.",
            "Pour les Commandes payées en ligne, tout remboursement s'effectue selon le mode de paiement initial, via MbiyoPay, dans les délais habituels de traitement de notre partenaire de paiement. Pour les Commandes payées à la livraison, aucun remboursement n'est nécessaire tant que le paiement en espèces n'a pas eu lieu.",
          ],
        },
        {
          heading: "Litiges avec un Vendeur",
          body: [
            "En cas de problème avec une Commande (produit non conforme, endommagé, non reçu malgré confirmation, etc.), vous pouvez ouvrir un litige depuis votre espace Acheteur.",
            "Swiftgoma peut intervenir en tant que médiateur entre vous et le Vendeur afin de faciliter une résolution équitable, sans garantir un résultat spécifique.",
            "Swiftgoma n'est pas partie au contrat de vente entre vous et le Vendeur, et n'est pas responsable de la qualité, de la conformité ou de la livraison effective des produits vendus, sous réserve du mécanisme de sécurisation des paiements décrit ci-dessus.",
          ],
        },
        {
          heading: "Livraison et Livreurs",
          body: [
            "Le Livreur assurant la remise de votre Commande est lié contractuellement au Vendeur, et non à Swiftgoma. Swiftgoma facilite uniquement la mise en relation technique entre vous et le Livreur via la Plateforme.",
            "Pour toute réclamation relative au comportement d'un Livreur lors d'une livraison, vous pouvez contacter le Vendeur concerné ou signaler l'incident à Swiftgoma, qui pourra prendre les mesures appropriées à l'égard du Vendeur conformément aux Conditions Vendeurs.",
          ],
        },
        {
          heading: "Avis et évaluations",
          body: [
            "Vous pouvez laisser un avis et une note concernant un produit ou un Vendeur après réception de votre Commande. Vos avis doivent refléter une expérience réelle et ne doivent pas contenir de contenu diffamatoire, trompeur ou sans rapport avec la Commande concernée.",
            "Swiftgoma se réserve le droit de retirer tout avis contraire à ces principes.",
          ],
        },
        {
          heading: "Obligations de l'Acheteur",
          body: [
            "Vous vous engagez à fournir des informations exactes lors de la commande (adresse de livraison, coordonnées) et à être disponible, ou à désigner une personne disponible, pour la réception de votre colis.",
            "Pour les Commandes payées à la livraison, vous vous engagez à disposer du montant exact ou d'un moyen de paiement en espèces suffisant au moment de la livraison.",
            "Il est interdit d'utiliser la Plateforme à des fins frauduleuses, notamment en confirmant faussement la réception d'un colis non reçu, ou en initiant des litiges abusifs.",
          ],
        },
        {
          heading: "Suspension du compte Acheteur",
          body: [
            "Swiftgoma se réserve le droit de suspendre ou de résilier votre compte Acheteur en cas de violation des présentes Conditions, de comportement frauduleux avéré, ou d'abus répétés des mécanismes de litige ou de remboursement.",
          ],
        },
        {
          heading: "Modification des présentes Conditions",
          body: [
            "Swiftgoma peut modifier les présentes Conditions Acheteurs à tout moment. Les modifications substantielles vous seront notifiées via votre espace Acheteur ou par email avant leur entrée en vigueur.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative à votre compte Acheteur ou aux présentes Conditions, contactez notre équipe à : support@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "Scope",
          body: [
            'These Buyer Terms apply to any individual or entity ("Buyer") using the Swiftgoma Platform to browse, order, and receive products or services from Sellers. They supplement, without replacing, Swiftgoma\'s Terms & Conditions.',
            "By placing an Order on the Platform, you agree to be bound by these Buyer Terms, in addition to the Terms & Conditions and Privacy Policy.",
          ],
        },
        {
          heading: "Placing an order",
          body: [
            "Any Order placed on the Platform constitutes an offer to purchase, subject to acceptance by the relevant Seller. The Seller has a maximum of one (1) day to confirm your Order.",
            "If the Seller does not confirm your Order within this timeframe, it is automatically cancelled. If you paid online, the amount is fully refunded to you with no action required on your part; if you chose cash on delivery, no amount was ever charged.",
            "Displayed prices are shown in the applicable currency (USD, CDF) and include applicable taxes unless otherwise stated.",
          ],
        },
        {
          heading: "Payment methods",
          body: [
            "Swiftgoma offers two payment methods when you confirm your Order:",
            "1. Online payment, processed via our partner MbiyoPay once the Order is confirmed by the Seller.",
            "2. Cash on Delivery (COD), where you pay the Order amount in cash directly to the Delivery rider or Seller at the time the parcel is handed over.",
            "Available payment methods may vary depending on the Seller, delivery zone, or Order amount. Once your Order is confirmed, the chosen payment method cannot be changed.",
          ],
        },
        {
          heading: "How your payment is secured",
          body: [
            "For Orders paid online, the amount is held by Swiftgoma as a safeguard until confirmation that the parcel was properly received, then released to the Seller. This means that if your parcel is never delivered, or a dispute arises before handoff, your funds have not yet been paid out to the Seller, which makes any refund easier to process.",
            "For Orders paid by cash on delivery, no amount is charged in advance: payment is made directly between you and the Delivery rider or Seller at the time the parcel is handed over. This payment method does not benefit from the safeguard mechanism described above, since no funds passed through Swiftgoma before delivery.",
          ],
        },
        {
          heading: "Receiving your order",
          body: [
            "At the time of delivery, a QR code is generated and displayed on your app. You must present it to the Delivery rider (or the Seller, depending on the delivery method used) so they can scan it to confirm handoff of the parcel.",
            "For Orders paid online, this QR code confirmation immediately triggers payout of the corresponding funds to the Seller; make sure to check the contents and condition of your parcel before allowing the scan, wherever possible.",
            "For Orders paid by cash on delivery, cash payment must be made before or at the time the QR code is scanned, as agreed with the Delivery rider or Seller.",
            "If you are unavailable at the time of delivery or refuse the parcel, contact the Seller or Swiftgoma customer support to arrange a new delivery attempt or a refund, in accordance with the Seller's posted return policy.",
          ],
        },
        {
          heading: "Cancellation and refunds",
          body: [
            "You may cancel an Order as long as it has not yet been confirmed by the Seller, directly from your Buyer dashboard.",
            "Once an Order has been confirmed by the Seller, applicable cancellation, return, or refund conditions are those posted on the relevant Seller's product listing or shop profile.",
            "For Orders paid online, any refund is issued via the original payment method, through MbiyoPay, within our payment partner's standard processing timeframes. For Orders paid by cash on delivery, no refund is necessary as long as cash payment has not yet taken place.",
          ],
        },
        {
          heading: "Disputes with a Seller",
          body: [
            "If a problem arises with an Order (non-compliant or damaged product, non-receipt despite confirmation, etc.), you can open a dispute from your Buyer dashboard.",
            "Swiftgoma may act as mediator between you and the Seller to facilitate a fair resolution, without guaranteeing any specific outcome.",
            "Swiftgoma is not a party to the sales contract between you and the Seller, and is not responsible for the quality, compliance, or actual delivery of products sold, subject to the payment-security mechanism described above.",
          ],
        },
        {
          heading: "Delivery and Delivery riders",
          body: [
            "The Delivery rider handling your Order is contractually affiliated with the Seller, not with Swiftgoma. Swiftgoma only facilitates the technical connection between you and the Delivery rider through the Platform.",
            "For any complaint regarding a Delivery rider's conduct during a delivery, you may contact the relevant Seller or report the incident to Swiftgoma, which may take appropriate action against the Seller in accordance with the Seller Terms.",
          ],
        },
        {
          heading: "Reviews and ratings",
          body: [
            "You may leave a review and rating for a product or Seller after receiving your Order. Your reviews must reflect a genuine experience and must not contain defamatory, misleading content, or content unrelated to the relevant Order.",
            "Swiftgoma reserves the right to remove any review that violates these principles.",
          ],
        },
        {
          heading: "Buyer obligations",
          body: [
            "You agree to provide accurate information when ordering (delivery address, contact details) and to be available, or to designate someone available, to receive your parcel.",
            "For Orders paid by cash on delivery, you agree to have the exact amount or sufficient cash available at the time of delivery.",
            "Using the Platform for fraudulent purposes is prohibited, including falsely confirming receipt of a parcel that was not received, or initiating abusive disputes.",
          ],
        },
        {
          heading: "Suspension of Buyer account",
          body: [
            "Swiftgoma reserves the right to suspend or terminate your Buyer account in the event of a breach of these Terms, proven fraudulent conduct, or repeated abuse of the dispute or refund mechanisms.",
          ],
        },
        {
          heading: "Changes to these Terms",
          body: [
            "Swiftgoma may modify these Buyer Terms at any time. Material changes will be notified to you via your Buyer dashboard or by email before taking effect.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding your Buyer account or these Terms, contact our team at: support@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
