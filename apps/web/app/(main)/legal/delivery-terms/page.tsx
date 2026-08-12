import { LegalDocument } from "../legal-document/legal-document";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions Livreurs",
  description: "Conditions d'utilisation SwiftGoma pour les livreurs.",
  path: "/legal/delivery-terms",
});

export default function DeliveryTermsPage() {
  return (
    <LegalDocument
      titleFr="Conditions Livreurs"
      titleEn="Delivery Terms"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Champ d'application",
          body: [
            "Les présentes Conditions Livreurs s'appliquent à toute personne physique (« Livreur ») utilisant la Plateforme Swiftgoma pour assurer la remise de Commandes aux Acheteurs, pour le compte d'un ou plusieurs Vendeurs. Elles complètent, sans s'y substituer, les Conditions générales d'utilisation de Swiftgoma.",
            "En activant un compte Livreur, vous acceptez d'être lié par les présentes Conditions Livreurs, en plus des Conditions générales et de la Politique de confidentialité.",
          ],
        },
        {
          heading: "Nature de la relation avec Swiftgoma",
          body: [
            "En tant que Livreur, vous êtes lié contractuellement au Vendeur pour le compte duquel vous effectuez une livraison, et non à Swiftgoma. Swiftgoma agit uniquement en tant qu'intermédiaire technique mettant à votre disposition la Plateforme permettant la mise en relation avec les Vendeurs et le suivi des livraisons.",
            "Les présentes Conditions Livreurs ne créent aucune relation d'employeur à employé, de mandat ou de partenariat entre vous et Swiftgoma. Les modalités de votre relation avec chaque Vendeur (rémunération, horaires, zone de couverture, etc.) relèvent d'un accord distinct entre vous et ce Vendeur, dont Swiftgoma n'est pas partie.",
            "Swiftgoma décline toute responsabilité relative à la relation contractuelle entre vous et un Vendeur, sauf disposition légale impérative contraire.",
          ],
        },
        {
          heading: "Vérification et activation du compte Livreur",
          body: [
            "L'ouverture d'un compte Livreur nécessite la fourniture d'informations d'identification (pièce d'identité, coordonnées de contact vérifiées et, le cas échéant, documents relatifs à votre moyen de transport).",
            "Swiftgoma se réserve le droit de refuser, suspendre ou retarder l'activation d'un compte Livreur en cas de doute raisonnable sur l'exactitude des informations fournies ou de non-conformité avec nos critères d'acceptation.",
          ],
        },
        {
          heading: "Exécution des livraisons",
          body: [
            "Vous vous engagez à récupérer et livrer les Commandes qui vous sont assignées avec diligence, dans les délais convenus avec le Vendeur, et en veillant à la bonne conservation du colis jusqu'à sa remise à l'Acheteur.",
            "Vous êtes responsable du respect du code de la route et des règles de sécurité applicables lors de vos déplacements, ainsi que du comportement respectueux envers les Acheteurs et les Vendeurs.",
          ],
        },
        {
          heading: "Confirmation de livraison par code QR",
          body: [
            "La remise d'un colis à un Acheteur doit être confirmée en scannant le code QR affiché sur l'application de l'Acheteur au moment de la livraison. Cette confirmation est obligatoire et constitue la seule preuve reconnue par la Plateforme de la bonne exécution de la livraison.",
            "Pour les Commandes payées en ligne, le scan du code QR déclenche immédiatement le versement des fonds correspondants au Portefeuille du Vendeur. Vous ne devez procéder au scan qu'après la remise effective et complète du colis à l'Acheteur.",
            "Pour les Commandes payées à la livraison (COD), vous êtes responsable de la collecte du montant en espèces auprès de l'Acheteur avant ou au moment du scan du code QR, selon les modalités convenues avec le Vendeur. La remise de ces fonds au Vendeur relève de l'accord conclu entre vous et ce dernier ; Swiftgoma n'intervient pas dans cette étape et n'est pas responsable de la bonne remise des espèces collectées.",
            "Il est strictement interdit de scanner un code QR sans remise effective du colis, ou de solliciter d'une autre manière une confirmation de livraison non conforme à la réalité.",
          ],
        },
        {
          heading: "Tentative de livraison infructueuse",
          body: [
            "Si l'Acheteur est absent, injoignable, ou refuse le colis au moment de la livraison, vous devez signaler l'incident via la Plateforme sans procéder au scan du code QR.",
            "Vous devez alors suivre les instructions du Vendeur concerné quant à une nouvelle tentative de livraison, un retour du colis, ou toute autre mesure applicable selon la politique de retour du Vendeur.",
            "Aucun versement de fonds n'est déclenché tant que la livraison n'a pas été confirmée par scan du code QR ; en cas de tentative infructueuse répétée d'une même Commande, le Vendeur ou Swiftgoma peut procéder à son annulation et, le cas échéant, au remboursement de l'Acheteur si un paiement en ligne avait été effectué.",
          ],
        },
        {
          heading: "Localisation et suivi",
          body: [
            "Votre position GPS est collectée par la Plateforme pendant toute livraison active, afin de permettre le suivi en temps réel de la Commande par l'Acheteur et le Vendeur concernés, conformément à notre Politique de confidentialité.",
            "Cette collecte cesse automatiquement à la clôture de la livraison (confirmation par code QR ou annulation).",
          ],
        },
        {
          heading: "Sécurité et comportement",
          body: [
            "Vous vous engagez à ne jamais ouvrir, altérer ou consommer le contenu d'un colis qui vous est confié, et à signaler immédiatement tout colis endommagé ou suspect au Vendeur concerné et à Swiftgoma.",
            "Tout comportement frauduleux, violent, ou portant atteinte à la sécurité ou à la confiance des Acheteurs et Vendeurs envers la Plateforme peut entraîner la suspension immédiate de votre compte Livreur.",
          ],
        },
        {
          heading: "Suspension et résiliation du compte Livreur",
          body: [
            "Swiftgoma peut suspendre ou résilier votre compte Livreur en cas de violation des présentes Conditions, de fraude avérée (notamment concernant la confirmation de livraisons non effectuées), ou de plaintes répétées et fondées de la part d'Acheteurs ou de Vendeurs.",
            "La résiliation de votre compte Livreur n'affecte pas les accords distincts que vous pourriez avoir conclus directement avec un ou plusieurs Vendeurs en dehors de la Plateforme.",
          ],
        },
        {
          heading: "Modification des présentes Conditions",
          body: [
            "Swiftgoma peut modifier les présentes Conditions Livreurs à tout moment. Les modifications substantielles vous seront notifiées via votre espace Livreur ou par email avant leur entrée en vigueur.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative à votre compte Livreur ou aux présentes Conditions, contactez notre équipe à : delivery@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "Scope",
          body: [
            'These Delivery Terms apply to any individual ("Delivery rider") using the Swiftgoma Platform to hand over Orders to Buyers on behalf of one or more Sellers. They supplement, without replacing, Swiftgoma\'s Terms & Conditions.',
            "By activating a Delivery rider account, you agree to be bound by these Delivery Terms, in addition to the Terms & Conditions and Privacy Policy.",
          ],
        },
        {
          heading: "Nature of your relationship with Swiftgoma",
          body: [
            "As a Delivery rider, you are contractually affiliated with the Seller on whose behalf you carry out a delivery, not with Swiftgoma. Swiftgoma acts solely as a technical intermediary providing the Platform that connects you with Sellers and enables delivery tracking.",
            "These Delivery Terms do not create any employment, agency, or partnership relationship between you and Swiftgoma. The terms of your relationship with each Seller (compensation, schedule, coverage area, etc.) are governed by a separate agreement between you and that Seller, to which Swiftgoma is not a party.",
            "Swiftgoma disclaims any liability relating to the contractual relationship between you and a Seller, except where mandatory law provides otherwise.",
          ],
        },
        {
          heading: "Delivery rider account verification and activation",
          body: [
            "Opening a Delivery rider account requires providing identification information (proof of identity, verified contact details, and, where applicable, documents relating to your mode of transport).",
            "Swiftgoma reserves the right to refuse, suspend, or delay activation of a Delivery rider account in the event of reasonable doubt regarding the accuracy of the information provided or non-compliance with our acceptance criteria.",
          ],
        },
        {
          heading: "Carrying out deliveries",
          body: [
            "You agree to collect and deliver assigned Orders diligently, within the timeframes agreed with the Seller, and to properly safeguard the parcel until it is handed over to the Buyer.",
            "You are responsible for complying with applicable traffic and safety rules during your trips, as well as for behaving respectfully toward Buyers and Sellers.",
          ],
        },
        {
          heading: "Delivery confirmation via QR code",
          body: [
            "Handing over a parcel to a Buyer must be confirmed by scanning the QR code displayed on the Buyer's app at the time of delivery. This confirmation is mandatory and constitutes the only proof recognized by the Platform that a delivery was properly completed.",
            "For Orders paid online, scanning the QR code immediately triggers payout of the corresponding funds to the Seller's Wallet. You must only perform the scan after the parcel has been fully and actually handed over to the Buyer.",
            "For Orders paid by cash on delivery (COD), you are responsible for collecting the cash amount from the Buyer before or at the time the QR code is scanned, as agreed with the Seller. Remitting these funds to the Seller is governed by the agreement between you and the Seller; Swiftgoma does not intervene in this step and is not responsible for the proper handover of collected cash.",
            "It is strictly prohibited to scan a QR code without an actual parcel handoff, or to otherwise solicit a delivery confirmation that does not reflect reality.",
          ],
        },
        {
          heading: "Failed delivery attempt",
          body: [
            "If the Buyer is absent, unreachable, or refuses the parcel at the time of delivery, you must report the incident through the Platform without scanning the QR code.",
            "You must then follow the relevant Seller's instructions regarding a new delivery attempt, return of the parcel, or any other applicable measure under the Seller's return policy.",
            "No funds are released until delivery has been confirmed by QR code scan; in the event of repeated failed attempts for the same Order, the Seller or Swiftgoma may cancel it and, where applicable, refund the Buyer if an online payment had been made.",
          ],
        },
        {
          heading: "Location and tracking",
          body: [
            "Your GPS location is collected by the Platform throughout any active delivery, to enable real-time tracking of the Order by the relevant Buyer and Seller, in accordance with our Privacy Policy.",
            "This collection automatically stops once the delivery is closed out (QR code confirmation or cancellation).",
          ],
        },
        {
          heading: "Safety and conduct",
          body: [
            "You agree to never open, tamper with, or consume the contents of a parcel entrusted to you, and to immediately report any damaged or suspicious parcel to the relevant Seller and to Swiftgoma.",
            "Any fraudulent or violent conduct, or conduct undermining the safety or trust of Buyers and Sellers in the Platform, may result in immediate suspension of your Delivery rider account.",
          ],
        },
        {
          heading: "Suspension and termination of Delivery rider account",
          body: [
            "Swiftgoma may suspend or terminate your Delivery rider account in the event of a breach of these Terms, proven fraud (particularly regarding confirmation of deliveries that were not actually made), or repeated, substantiated complaints from Buyers or Sellers.",
            "Termination of your Delivery rider account does not affect any separate agreements you may have entered into directly with one or more Sellers outside the Platform.",
          ],
        },
        {
          heading: "Changes to these Terms",
          body: [
            "Swiftgoma may modify these Delivery Terms at any time. Material changes will be notified to you via your Delivery rider dashboard or by email before taking effect.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding your Delivery rider account or these Terms, contact our team at: delivery@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
