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

const RIDER_TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Rider Terms & Conditions",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'These Rider Terms & Conditions ("Rider Terms") apply in addition to our general Terms & Conditions and govern your use of Swiftgoma as a Rider delivering Orders on behalf of a Seller.',
      "You become a Rider by accepting an invitation from a Seller and confirming it with a one-time code. By confirming that invitation or fulfilling any Order, you agree to these Rider Terms in addition to the general Terms & Conditions. Where these Rider Terms conflict with the general Terms & Conditions, these Rider Terms take precedence for matters specific to delivering on the Platform.",
    ],
    sections: [
      {
        heading: "1. Becoming a Rider",
        paragraphs: [
          "A Seller invites you as a Rider by sending an invitation to your phone number or email. You confirm the invitation with a one-time code, after which your Rider account is affiliated with that Seller only. You are not a Rider for any other Seller unless separately invited and confirmed by them.",
          "You may be asked to provide a photo and select a vehicle type (motorcycle, bicycle, car, or on foot) as part of setting up your Rider profile. Keep this information accurate and up to date.",
        ],
      },
      {
        heading: "2. Your Relationship With the Seller",
        paragraphs: [
          "Riders are never Swiftgoma employees, contractors, or platform-managed resources. Your relationship with the Seller who invited you — including any pay, schedule, equipment, or working arrangement — is between you and that Seller and is not set or guaranteed by Swiftgoma.",
          "Swiftgoma provides the technology that assigns Orders to you, tracks delivery status, and coordinates handoff confirmation, but does not direct your work hours, routes, or availability. Your Seller may activate, deactivate, or suspend your Rider account for their Shop at their discretion.",
        ],
      },
      {
        heading: "3. Availability & Order Assignment",
        paragraphs: [
          "You may toggle your availability on or off at any time; you will only be considered for new Order assignments while marked available. Accepting an assignment means you intend to complete that delivery in a timely manner.",
          "Your Rider status (pending, active, or suspended) determines whether you can be assigned Orders. A suspended Rider account cannot be assigned new Orders until it is reactivated by the Seller.",
        ],
      },
      {
        heading: "4. Fulfilling an Order",
        paragraphs: [
          "Once assigned an Order, you are responsible for collecting it from the Seller's Shop and delivering it to the Buyer's address in a reasonably timely manner, handling the Product with care throughout.",
          "For cash-on-delivery Orders, you are responsible for collecting the correct amount from the Buyer at handoff and reconciling that cash with the Seller according to their arrangement with you. For online-payment Orders, no cash changes hands at delivery.",
          "Every handoff — to the Buyer at delivery, or from the Seller at pickup where applicable — is confirmed by scanning the Order's QR code. Do not mark or claim an Order as delivered without scanning the correct QR code, and do not accept a substitute for the scan.",
        ],
      },
      {
        heading: "5. Buyer Interactions",
        paragraphs: [
          "You must treat Buyers respectfully and professionally, and only use their contact details and delivery location for the purpose of completing the assigned Order. If a Buyer is unreachable or a delivery location appears incorrect, contact the Seller rather than resolving it on your own.",
          "You may not ask a Buyer to pay you an amount different from what is shown for their Order, and you may not request payment through any channel outside the Order's designated payment method.",
        ],
      },
      {
        heading: "6. Rider Conduct",
        paragraphs: ["As a Rider, you agree not to:"],
        bullets: [
          "mark or scan an Order as delivered before it has actually been handed to the Buyer;",
          "collect or retain cash-on-delivery amounts beyond what is due for the Order;",
          "share a Buyer's or Seller's contact details or location for any purpose unrelated to fulfilling the Order;",
          "handle Products in a way that damages, tampers with, or contaminates them;",
          "harass, discriminate against, or mistreat Buyers, Sellers, or Swiftgoma staff;",
          "use another Rider's account or allow anyone else to use yours to fulfil Orders;",
          "operate a vehicle in a manner that endangers yourself, Buyers, or the public.",
        ],
      },
      {
        heading: "7. Suspension & Removal",
        paragraphs: [
          "The Seller who invited you may deactivate or suspend your Rider account for their Shop at any time; this does not by itself affect any Rider affiliation you may separately hold with another Seller. Swiftgoma's Support or Admin team may also suspend a Rider account platform-wide where we reasonably believe these Rider Terms, the general Terms & Conditions, or applicable law have been violated.",
          "Where possible, we or the Seller will provide the reason for a suspension and, where applicable, how it can be resolved. Suspension does not cancel obligations already incurred, such as cash owed to a Seller for Orders you have already delivered.",
        ],
      },
      {
        heading: "8. Your Data as a Rider",
        paragraphs: [
          "Your profile information, vehicle type, availability status, and delivery activity are handled in accordance with our Privacy Policy and are visible to the Seller who invited you as needed to assign and track Orders.",
        ],
      },
      {
        heading: "9. Liability",
        paragraphs: [
          "You are responsible for your own conduct while fulfilling Orders, including your handling of cash-on-delivery payments, your interactions with Buyers, and your operation of any vehicle you use. Swiftgoma is not a party to your working arrangement with the Seller and is not responsible for pay disputes, equipment, or working conditions between you and the Seller, except as otherwise stated in our general Terms & Conditions.",
        ],
      },
      {
        heading: "10. Changes to These Rider Terms",
        paragraphs: [
          'We may update these Rider Terms from time to time to reflect changes to rider features or applicable law. We will update the "Last updated" date above and, for material changes, provide additional notice such as an in-app notification or email.',
        ],
      },
      {
        heading: "11. Contact Us",
        paragraphs: [
          "For questions about these Rider Terms, use the contact form below, write to info@swiftgoma.com, or reach us through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },
  fr: {
    title: "Conditions générales livreur",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Les présentes Conditions livreur s'appliquent en complément de nos Conditions générales et régissent votre utilisation de Swiftgoma en tant que Livreur effectuant des livraisons pour le compte d'un Vendeur.",
      "Vous devenez Livreur en acceptant une invitation d'un Vendeur et en la confirmant avec un code à usage unique. En confirmant cette invitation ou en exécutant une Commande, vous acceptez les présentes Conditions livreur en plus des Conditions générales. En cas de conflit entre les présentes Conditions livreur et les Conditions générales, les présentes Conditions livreur prévalent pour les questions propres à la livraison sur la Plateforme.",
    ],
    sections: [
      {
        heading: "1. Devenir Livreur",
        paragraphs: [
          "Un Vendeur vous invite en tant que Livreur en envoyant une invitation à votre numéro de téléphone ou à votre adresse e-mail. Vous confirmez l'invitation avec un code à usage unique, après quoi votre compte Livreur est affilié uniquement à ce Vendeur. Vous n'êtes Livreur pour aucun autre Vendeur, sauf invitation et confirmation distinctes de leur part.",
          "Il peut vous être demandé de fournir une photo et de sélectionner un type de véhicule (moto, vélo, voiture ou à pied) lors de la configuration de votre profil Livreur. Veillez à ce que ces informations restent exactes et à jour.",
        ],
      },
      {
        heading: "2. Votre relation avec le Vendeur",
        paragraphs: [
          "Les Livreurs ne sont jamais des employés, prestataires ou ressources gérées par la Plateforme Swiftgoma. Votre relation avec le Vendeur qui vous a invité — y compris toute rémunération, horaire, équipement ou modalité de travail — est établie entre vous et ce Vendeur et n'est ni fixée ni garantie par Swiftgoma.",
          "Swiftgoma fournit la technologie qui vous assigne des Commandes, suit le statut de livraison et coordonne la confirmation de remise, mais ne dirige pas vos horaires de travail, vos itinéraires ni votre disponibilité. Votre Vendeur peut activer, désactiver ou suspendre votre compte Livreur pour sa Boutique à sa discrétion.",
        ],
      },
      {
        heading: "3. Disponibilité & attribution des commandes",
        paragraphs: [
          "Vous pouvez activer ou désactiver votre disponibilité à tout moment ; vous ne serez pris en compte pour de nouvelles attributions de Commandes que lorsque vous êtes marqué disponible. Accepter une attribution signifie que vous avez l'intention d'effectuer cette livraison dans un délai raisonnable.",
          "Votre statut de Livreur (en attente, actif ou suspendu) détermine si des Commandes peuvent vous être attribuées. Un compte Livreur suspendu ne peut se voir attribuer de nouvelles Commandes tant qu'il n'a pas été réactivé par le Vendeur.",
        ],
      },
      {
        heading: "4. Exécuter une commande",
        paragraphs: [
          "Une fois qu'une Commande vous est attribuée, vous êtes responsable de la récupérer à la Boutique du Vendeur et de la livrer à l'adresse de l'Acheteur dans un délai raisonnable, en manipulant le Produit avec soin tout au long du trajet.",
          "Pour les Commandes payées à la livraison, vous êtes responsable de collecter le montant exact auprès de l'Acheteur lors de la remise et de reverser cet argent au Vendeur selon l'arrangement convenu avec lui. Pour les Commandes payées en ligne, aucun échange d'argent n'a lieu lors de la livraison.",
          "Chaque remise — à l'Acheteur lors de la livraison, ou par le Vendeur lors du retrait le cas échéant — est confirmée par le scan du code QR de la Commande. Ne marquez ni ne déclarez jamais une Commande comme livrée sans avoir scanné le bon code QR, et n'acceptez aucun substitut à ce scan.",
        ],
      },
      {
        heading: "5. Interactions avec les acheteurs",
        paragraphs: [
          "Vous devez traiter les Acheteurs avec respect et professionnalisme, et n'utiliser leurs coordonnées et leur lieu de livraison qu'aux fins d'exécution de la Commande attribuée. Si un Acheteur est injoignable ou qu'un lieu de livraison semble incorrect, contactez le Vendeur plutôt que de résoudre la situation vous-même.",
          "Vous ne pouvez pas demander à un Acheteur de vous payer un montant différent de celui indiqué pour sa Commande, ni demander un paiement par un canal autre que le mode de paiement désigné pour la Commande.",
        ],
      },
      {
        heading: "6. Conduite du livreur",
        paragraphs: ["En tant que Livreur, vous vous engagez à ne pas :"],
        bullets: [
          "marquer ou scanner une Commande comme livrée avant qu'elle n'ait réellement été remise à l'Acheteur ;",
          "collecter ou conserver des montants payés à la livraison au-delà de ce qui est dû pour la Commande ;",
          "partager les coordonnées ou le lieu d'un Acheteur ou d'un Vendeur à des fins sans rapport avec l'exécution de la Commande ;",
          "manipuler les Produits d'une manière qui les endommage, les altère ou les contamine ;",
          "harceler, discriminer ou maltraiter les Acheteurs, les Vendeurs ou le personnel Swiftgoma ;",
          "utiliser le compte d'un autre Livreur ou permettre à quiconque d'utiliser le vôtre pour exécuter des Commandes ;",
          "conduire un véhicule d'une manière qui vous met en danger, vous-même, les Acheteurs ou le public.",
        ],
      },
      {
        heading: "7. Suspension & retrait",
        paragraphs: [
          "Le Vendeur qui vous a invité peut désactiver ou suspendre votre compte Livreur pour sa Boutique à tout moment ; cela n'affecte pas en soi une éventuelle affiliation distincte que vous auriez avec un autre Vendeur. L'équipe Support ou Admin de Swiftgoma peut également suspendre un compte Livreur à l'échelle de la Plateforme lorsque nous avons des raisons de croire que les présentes Conditions livreur, les Conditions générales ou la loi applicable ont été enfreintes.",
          "Dans la mesure du possible, nous ou le Vendeur indiquerons le motif d'une suspension et, le cas échéant, comment y remédier. La suspension n'annule pas les obligations déjà engagées, telles que des sommes dues à un Vendeur pour des Commandes déjà livrées.",
        ],
      },
      {
        heading: "8. Vos données en tant que livreur",
        paragraphs: [
          "Les informations de votre profil, votre type de véhicule, votre statut de disponibilité et votre activité de livraison sont traités conformément à notre Politique de confidentialité et sont visibles par le Vendeur qui vous a invité dans la mesure nécessaire à l'attribution et au suivi des Commandes.",
        ],
      },
      {
        heading: "9. Responsabilité",
        paragraphs: [
          "Vous êtes responsable de votre propre conduite lors de l'exécution des Commandes, y compris de la gestion des paiements à la livraison, de vos interactions avec les Acheteurs et de la conduite de tout véhicule que vous utilisez. Swiftgoma n'est pas partie à votre relation de travail avec le Vendeur et n'est pas responsable des litiges de rémunération, de l'équipement ou des conditions de travail entre vous et le Vendeur, sauf disposition contraire de nos Conditions générales.",
        ],
      },
      {
        heading: "10. Modifications des présentes Conditions livreur",
        paragraphs: [
          "Nous pouvons mettre à jour les présentes Conditions livreur de temps à autre pour refléter des évolutions des fonctionnalités livreur ou de la loi applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus et, pour les modifications substantielles, fournirons un avis supplémentaire tel qu'une notification in-app ou un e-mail.",
        ],
      },
      {
        heading: "11. Nous contacter",
        paragraphs: [
          "Pour toute question relative aux présentes Conditions livreur, utilisez le formulaire de contact ci-dessous, écrivez à info@swiftgoma.com, ou passez par la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function RiderTermsPage() {
  const locale = await getServerLocale();
  const content = RIDER_TERMS_CONTENT[locale];

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
