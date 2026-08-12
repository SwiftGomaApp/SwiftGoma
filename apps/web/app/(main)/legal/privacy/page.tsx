import { LegalDocument } from "../legal-document/legal-document";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et protection des données personnelles sur SwiftGoma.",
  path: "/legal/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalDocument
      titleFr="Politique de confidentialité"
      titleEn="Privacy Policy"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Introduction",
          body: [
            "Swiftgoma (« nous », « notre ») accorde une grande importance à la protection de vos données personnelles. La présente Politique de confidentialité décrit quelles données nous collectons, pourquoi nous les collectons, comment nous les utilisons, et les droits dont vous disposez à leur égard, que vous utilisiez la Plateforme en tant qu'Acheteur, Vendeur ou Livreur.",
          ],
        },
        {
          heading: "Données que nous collectons",
          body: [
            "Données de compte : nom, adresse email, numéro de téléphone, mot de passe (chiffré) ou clé d'accès biométrique (passkey), rôle(s) sur la Plateforme.",
            "Données de vérification d'identité : pour les Vendeurs et Livreurs, des documents d'identité et informations complémentaires peuvent être requis afin de nous conformer à nos obligations légales et de lutte contre la fraude.",
            "Données de transaction : historique des Commandes, montants, devises utilisées (USD, CDF), statut des paiements et retraits. Nous ne collectons ni ne stockons les numéros complets de carte bancaire ou de compte mobile money ; ces données sont traitées directement par notre partenaire de paiement, MbiyoPay.",
            "Données de localisation : pour les Livreurs, la position GPS est collectée pendant les livraisons actives afin de permettre le suivi en temps réel des commandes.",
            "Données techniques : adresse IP, type d'appareil, système d'exploitation, identifiants de session, et données de journalisation (logs) à des fins de sécurité et de diagnostic.",
            "Préférences : langue préférée (français/anglais), préférences de notification (email, SMS, push, in-app), consentement marketing et horodatage associé.",
          ],
        },
        {
          heading: "Finalités du traitement",
          body: [
            "Fournir, exploiter et sécuriser la Plateforme, y compris la création et la gestion de votre compte, l'authentification (notamment via passkey/WebAuthn), et le traitement des Commandes.",
            "Faciliter les paiements et retraits via MbiyoPay, y compris la validation par code à usage unique (OTP) et la gestion du Portefeuille Vendeur.",
            "Assurer la sécurité de la Plateforme, prévenir la fraude, et faire respecter nos Conditions générales d'utilisation.",
            "Vous envoyer des notifications transactionnelles (confirmation de commande, statut de livraison, alertes de sécurité) et, sous réserve de votre consentement, des communications marketing.",
            "Améliorer nos services par l'analyse de l'utilisation de la Plateforme.",
          ],
        },
        {
          heading: "Base légale du traitement",
          body: [
            "Nous traitons vos données sur la base de l'exécution du contrat qui nous lie à vous (fourniture des services de la Plateforme), du respect de nos obligations légales (lutte contre la fraude, vérification d'identité), de notre intérêt légitime (sécurité, amélioration du service), et, lorsque requis, de votre consentement explicite (notamment pour les communications marketing).",
          ],
        },
        {
          heading: "Partage des données",
          body: [
            "Avec MbiyoPay, notre partenaire de traitement des paiements, dans la stricte mesure nécessaire au traitement des transactions et retraits.",
            "Avec les autres Utilisateurs de la Plateforme, dans la mesure nécessaire à l'exécution d'une Commande (par exemple, un Vendeur reçoit l'adresse de livraison d'un Acheteur ; un Livreur reçoit les coordonnées nécessaires à la livraison).",
            "Avec des prestataires techniques (hébergement, infrastructure cloud, outils d'envoi de notifications) agissant en tant que sous-traitants, dans le strict cadre de nos instructions.",
            "Avec les autorités compétentes, lorsque la loi l'exige ou en cas de demande légale valide.",
            "Swiftgoma ne vend jamais vos données personnelles à des tiers à des fins publicitaires.",
          ],
        },
        {
          heading: "Sécurité des données",
          body: [
            "Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données, notamment le chiffrement des données sensibles, l'authentification forte (passkeys WebAuthn, 2FA par TOTP), et des contrôles d'accès stricts à notre infrastructure.",
            "Malgré ces mesures, aucun système n'est infaillible à 100 %. En cas de violation de données susceptible d'affecter significativement vos droits, nous vous en informerons conformément à la réglementation applicable.",
          ],
        },
        {
          heading: "Conservation des données",
          body: [
            "Nous conservons vos données personnelles aussi longtemps que nécessaire aux finalités décrites dans la présente politique, notamment pendant la durée de votre compte actif, puis pendant la durée requise par nos obligations légales et comptables après la clôture de votre compte.",
            "Les données de transaction sont conservées conformément aux exigences légales applicables en matière de comptabilité et de lutte contre la fraude financière.",
          ],
        },
        {
          heading: "Vos droits",
          body: [
            "Sous réserve de la législation applicable, vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles, ainsi que d'un droit d'opposition ou de limitation du traitement dans certains cas.",
            "Vous pouvez à tout moment retirer votre consentement aux communications marketing depuis les paramètres de votre compte ou via le lien de désinscription présent dans nos emails. Notez que les alertes de sécurité restent toujours actives, quel que soit votre choix, bien que le canal de notification (email, SMS, push) reste configurable.",
            "Pour exercer ces droits, contactez-nous à privacy@swiftgoma.com.",
          ],
        },
        {
          heading: "Transferts internationaux",
          body: [
            "Notre infrastructure technique peut impliquer le traitement de données en dehors de votre pays de résidence. Dans ce cas, nous veillons à ce que des garanties appropriées soient mises en place pour assurer un niveau de protection adéquat de vos données.",
          ],
        },
        {
          heading: "Mineurs",
          body: [
            "La Plateforme n'est pas destinée aux personnes de moins de 18 ans. Nous ne collectons pas sciemment de données personnelles concernant des mineurs. Si vous pensez qu'un mineur nous a fourni des données personnelles, contactez-nous afin que nous puissions les supprimer.",
          ],
        },
        {
          heading: "Modifications de la présente politique",
          body: [
            "Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre. Toute modification substantielle vous sera notifiée par email ou via la Plateforme avant son entrée en vigueur.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative à cette politique ou au traitement de vos données personnelles, contactez notre équipe à : privacy@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "Introduction",
          body: [
            'Swiftgoma ("we," "us," "our") takes the protection of your personal data seriously. This Privacy Policy describes what data we collect, why we collect it, how we use it, and the rights you have over it, whether you use the Platform as a Buyer, Seller, or Delivery rider.',
          ],
        },
        {
          heading: "Data we collect",
          body: [
            "Account data: name, email address, phone number, password (encrypted) or biometric passkey, role(s) on the Platform.",
            "Identity verification data: for Sellers and Delivery riders, identity documents and additional information may be required to comply with our legal and anti-fraud obligations.",
            "Transaction data: Order history, amounts, currencies used (USD, CDF), payment and withdrawal status. We do not collect or store full card numbers or mobile money account numbers; this data is processed directly by our payment partner, MbiyoPay.",
            "Location data: for Delivery riders, GPS position is collected during active deliveries to enable real-time order tracking.",
            "Technical data: IP address, device type, operating system, session identifiers, and log data for security and diagnostic purposes.",
            "Preferences: preferred language (French/English), notification preferences (email, SMS, push, in-app), marketing consent and associated timestamp.",
          ],
        },
        {
          heading: "Purposes of processing",
          body: [
            "To provide, operate, and secure the Platform, including account creation and management, authentication (including via passkey/WebAuthn), and Order processing.",
            "To facilitate payments and withdrawals via MbiyoPay, including one-time-password (OTP) validation and Seller Wallet management.",
            "To secure the Platform, prevent fraud, and enforce our Terms & Conditions.",
            "To send you transactional notifications (order confirmation, delivery status, security alerts) and, subject to your consent, marketing communications.",
            "To improve our services through analysis of Platform usage.",
          ],
        },
        {
          heading: "Legal basis for processing",
          body: [
            "We process your data on the basis of performance of our contract with you (providing Platform services), compliance with legal obligations (fraud prevention, identity verification), our legitimate interest (security, service improvement), and, where required, your explicit consent (particularly for marketing communications).",
          ],
        },
        {
          heading: "Data sharing",
          body: [
            "With MbiyoPay, our payment processing partner, strictly to the extent necessary to process transactions and withdrawals.",
            "With other Platform Users, to the extent necessary to fulfill an Order (for example, a Seller receives a Buyer's delivery address; a Delivery rider receives the contact details needed for delivery).",
            "With technical service providers (hosting, cloud infrastructure, notification delivery tools) acting as processors, strictly under our instructions.",
            "With competent authorities, where required by law or in response to a valid legal request.",
            "Swiftgoma never sells your personal data to third parties for advertising purposes.",
          ],
        },
        {
          heading: "Data security",
          body: [
            "We implement appropriate technical and organizational measures to protect your data, including encryption of sensitive data, strong authentication (WebAuthn passkeys, TOTP-based 2FA), and strict access controls on our infrastructure.",
            "Despite these measures, no system is 100% infallible. In the event of a data breach likely to significantly affect your rights, we will notify you in accordance with applicable regulations.",
          ],
        },
        {
          heading: "Data retention",
          body: [
            "We retain your personal data for as long as necessary for the purposes described in this policy, including for the duration of your active account, and thereafter for the period required by our legal and accounting obligations after account closure.",
            "Transaction data is retained in accordance with applicable legal requirements regarding accounting and anti-financial-fraud obligations.",
          ],
        },
        {
          heading: "Your rights",
          body: [
            "Subject to applicable law, you have the right to access, correct, delete, and port your personal data, as well as the right to object to or restrict processing in certain cases.",
            "You may withdraw your consent to marketing communications at any time from your account settings or via the unsubscribe link in our emails. Note that security alerts always remain active regardless of your choice, though the notification channel (email, SMS, push) remains configurable.",
            "To exercise these rights, contact us at privacy@swiftgoma.com.",
          ],
        },
        {
          heading: "International transfers",
          body: [
            "Our technical infrastructure may involve processing data outside your country of residence. In such cases, we ensure appropriate safeguards are in place to maintain an adequate level of protection for your data.",
          ],
        },
        {
          heading: "Minors",
          body: [
            "The Platform is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has provided us with personal data, please contact us so we can delete it.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We may update this Privacy Policy from time to time. Any material change will be notified to you by email or via the Platform before it takes effect.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding this policy or the processing of your personal data, contact our team at: privacy@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
