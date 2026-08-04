import { LegalDocument } from "../legal-document/legal-document";

export const metadata = {
  title: "Politique de cookies",
};

export default function CookiesPage() {
  return (
    <LegalDocument
      titleFr="Politique de cookies"
      titleEn="Cookie Policy"
      lastUpdated="1 août 2026"
      sectionsFr={[
        {
          heading: "Qu'est-ce qu'un cookie ?",
          body: [
            "Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, téléphone, tablette) lorsque vous visitez un site web ou utilisez une application. Il permet au site ou à l'application de mémoriser certaines informations vous concernant, telles que vos préférences ou votre état de connexion, lors de vos visites suivantes.",
            "Le terme « cookie » est utilisé dans la présente politique de manière générique pour désigner les cookies ainsi que les technologies similaires (stockage local du navigateur, identifiants de session, etc.) utilisées par la Plateforme Swiftgoma.",
          ],
        },
        {
          heading: "Pourquoi utilisons-nous des cookies ?",
          body: [
            "Nous utilisons des cookies et technologies similaires pour assurer le bon fonctionnement de la Plateforme, sécuriser votre session, mémoriser vos préférences (langue, thème d'affichage), et comprendre comment la Plateforme est utilisée afin de l'améliorer.",
          ],
        },
        {
          heading: "Catégories de cookies utilisées",
          body: [
            "Cookies strictement nécessaires : indispensables au fonctionnement de la Plateforme, notamment pour maintenir votre session active après connexion, sécuriser votre compte (y compris lors de l'utilisation de clés d'accès biométriques ou passkeys), et assurer la répartition de charge de nos serveurs. Ces cookies ne peuvent pas être désactivés, car la Plateforme ne peut pas fonctionner correctement sans eux.",
            "Cookies de préférence : permettent de mémoriser vos choix, tels que la langue d'affichage (français ou anglais) ou le thème visuel (clair, sombre, ou automatique selon votre système). Ces informations peuvent également être stockées via le stockage local de votre navigateur plutôt que par cookie à proprement parler.",
            "Cookies de mesure d'audience : nous aident à comprendre comment la Plateforme est utilisée (pages consultées, parcours de navigation, erreurs rencontrées) afin d'en améliorer les performances et l'ergonomie. Lorsque ces cookies sont utilisés, les données collectées sont agrégées et ne visent pas à vous identifier individuellement à des fins publicitaires.",
          ],
        },
        {
          heading: "Cookies tiers",
          body: [
            "Certaines fonctionnalités de la Plateforme font appel à des prestataires tiers susceptibles de déposer leurs propres cookies, notamment notre partenaire de paiement MbiyoPay lors du traitement d'un paiement en ligne, et notre partenaire PawaPay lors du traitement d'un paiement d'abonnement Vendeur. Ces prestataires agissent selon leurs propres politiques de confidentialité et de cookies, que nous vous invitons à consulter directement auprès d'eux.",
            "Swiftgoma ne dépose aucun cookie publicitaire tiers et ne partage pas vos données de navigation à des fins de publicité ciblée.",
          ],
        },
        {
          heading: "Durée de conservation",
          body: [
            "Les cookies strictement nécessaires liés à votre session sont généralement supprimés à la fermeture de votre navigateur ou à l'expiration de votre session. Les cookies de préférence peuvent être conservés plus longtemps afin d'éviter de vous redemander vos choix à chaque visite, dans la limite de treize (13) mois maximum, conformément aux bonnes pratiques en matière de cookies.",
          ],
        },
        {
          heading: "Comment gérer vos préférences de cookies",
          body: [
            "La plupart des navigateurs vous permettent de gérer vos préférences en matière de cookies, notamment de les bloquer ou de les supprimer, via leurs paramètres. Notez que le blocage des cookies strictement nécessaires peut empêcher certaines fonctionnalités de la Plateforme de fonctionner correctement, notamment la connexion à votre compte.",
            "Vos préférences de notification (email, SMS, push, in-app) et de langue peuvent être gérées directement depuis les paramètres de votre compte Swiftgoma, indépendamment de vos réglages de navigateur.",
          ],
        },
        {
          heading: "Modification de la présente politique",
          body: [
            "Nous pouvons mettre à jour cette Politique de cookies de temps à autre, notamment en cas d'évolution des technologies utilisées par la Plateforme. Toute modification substantielle vous sera notifiée via la Plateforme avant son entrée en vigueur.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "Pour toute question relative à cette politique, contactez notre équipe à : privacy@swiftgoma.com.",
          ],
        },
      ]}
      sectionsEn={[
        {
          heading: "What is a cookie?",
          body: [
            "A cookie is a small text file placed on your device (computer, phone, tablet) when you visit a website or use an application. It allows the site or application to remember certain information about you, such as your preferences or login state, during subsequent visits.",
            'The term "cookie" is used generically throughout this policy to refer to cookies as well as similar technologies (browser local storage, session identifiers, etc.) used by the Swiftgoma Platform.',
          ],
        },
        {
          heading: "Why we use cookies",
          body: [
            "We use cookies and similar technologies to ensure the Platform functions properly, secure your session, remember your preferences (language, display theme), and understand how the Platform is used so we can improve it.",
          ],
        },
        {
          heading: "Categories of cookies we use",
          body: [
            "Strictly necessary cookies: essential to the operation of the Platform, particularly to keep your session active after login, secure your account (including when using biometric passkeys), and balance load across our servers. These cookies cannot be disabled, as the Platform cannot function properly without them.",
            "Preference cookies: allow us to remember your choices, such as display language (French or English) or visual theme (light, dark, or automatic based on your system). This information may also be stored via your browser's local storage rather than a cookie in the strict sense.",
            "Audience measurement cookies: help us understand how the Platform is used (pages visited, navigation paths, errors encountered) in order to improve its performance and usability. Where these cookies are used, the data collected is aggregated and is not intended to identify you individually for advertising purposes.",
          ],
        },
        {
          heading: "Third-party cookies",
          body: [
            "Certain features of the Platform rely on third-party providers that may place their own cookies, particularly our payment partner MbiyoPay when processing an online payment, and our partner PawaPay when processing a Seller subscription payment. These providers operate under their own privacy and cookie policies, which we encourage you to review directly with them.",
            "Swiftgoma does not place any third-party advertising cookies and does not share your browsing data for targeted advertising purposes.",
          ],
        },
        {
          heading: "Retention period",
          body: [
            "Strictly necessary cookies tied to your session are generally deleted when you close your browser or when your session expires. Preference cookies may be retained longer to avoid asking you to re-select your choices on every visit, for a maximum of thirteen (13) months, in line with standard cookie practices.",
          ],
        },
        {
          heading: "Managing your cookie preferences",
          body: [
            "Most browsers allow you to manage your cookie preferences, including blocking or deleting them, through their settings. Note that blocking strictly necessary cookies may prevent certain features of the Platform from working properly, including logging into your account.",
            "Your notification preferences (email, SMS, push, in-app) and language can be managed directly from your Swiftgoma account settings, independently of your browser settings.",
          ],
        },
        {
          heading: "Changes to this policy",
          body: [
            "We may update this Cookie Policy from time to time, particularly as the technologies used by the Platform evolve. Any material change will be notified to you via the Platform before it takes effect.",
          ],
        },
        {
          heading: "Contact",
          body: [
            "For any questions regarding this policy, contact our team at: privacy@swiftgoma.com.",
          ],
        },
      ]}
    />
  );
}
