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

const COOKIE_TERMS_CONTENT: Record<Locale, TermsContent> = {
  en: {
    title: "Cookie Policy & Cookie Terms",
    lastUpdated: `Last updated: ${LAST_UPDATED.en}`,
    intro: [
      'These Cookie Terms ("Cookie Terms") explain how Swiftgoma ("Swiftgoma", "we", "us", or "our") uses cookies and similar technologies when you access or use the Platform.',
      "Cookies help us provide essential functionality, maintain secure authentication sessions, remember certain information, and ensure that the Platform works as intended. By using Swiftgoma, you acknowledge that cookies may be used as described in these Cookie Terms.",
    ],
    sections: [
      {
        heading: "1. What Are Cookies?",
        paragraphs: [
          "Cookies are small text files stored on your device by a website or application. They allow the Platform to recognize your browser or device and maintain certain information between requests.",
          "Swiftgoma primarily uses cookies that are necessary for authentication, session management, security, and the proper operation of the Platform.",
        ],
      },
      {
        heading: "2. Cookies We Use",
        paragraphs: [
          "Swiftgoma currently uses authentication cookies to manage your login session and securely authenticate requests to protected areas of the Platform.",
        ],
      },
      {
        heading: "3. Authentication Cookies",
        paragraphs: [
          "Swiftgoma uses an access token cookie to authenticate requests while you are logged in. This cookie has a short lifetime and allows the Platform to maintain your authenticated access.",
          "Swiftgoma also uses a refresh token cookie to obtain a new access token when the current access token expires. This allows your authenticated session to continue without requiring you to log in again immediately.",
        ],
        bullets: [
          "`swg_access_token` — used to authenticate requests made while you are logged in.",
          "`swg_refresh_token` — used to refresh your authentication session when the access token expires.",
        ],
      },
      {
        heading: "4. Cookie Security",
        paragraphs: [
          "Swiftgoma configures its authentication cookies with security protections designed to help protect your account and authentication credentials.",
          "Authentication cookies are configured as HttpOnly, which means that client-side JavaScript cannot directly read their values.",
          "In production environments, authentication cookies are configured as Secure, meaning that they are transmitted only over secure HTTPS connections.",
          "Swiftgoma also uses a SameSite policy to help reduce the risk of unauthorized cross-site requests.",
        ],
      },
      {
        heading: "5. Cookie Lifetime",
        paragraphs: [
          "The lifetime of our authentication cookies is linked to your authentication session.",
          "The access token cookie is configured with a short lifetime, currently 15 minutes by default.",
          "The refresh token cookie is configured with a longer lifetime, currently 30 days by default.",
          "These durations may change as we improve our authentication, security, and session management systems.",
          "Cookies may also be removed earlier when you log out, when your session is revoked, or when your authentication session becomes invalid.",
        ],
      },
      {
        heading: "6. Cookies and Your Login Session",
        paragraphs: [
          "When you sign in to Swiftgoma, authentication cookies may be stored on your device to maintain your authenticated session.",
          "These cookies allow Swiftgoma to recognize authenticated requests without requiring you to provide your login credentials with every request.",
          "If you delete, block, or prevent essential authentication cookies from being stored, certain account features may no longer function correctly and you may be required to sign in again.",
        ],
      },
      {
        heading: "7. Cookies and Account Security",
        paragraphs: [
          "Authentication cookies are an important part of Swiftgoma's account security system.",
          "Swiftgoma may invalidate or revoke authentication sessions when necessary for security purposes. Once a session is revoked or expires, the associated authentication credentials can no longer be used to access the account.",
          "You are responsible for protecting access to the device and browser that you use to access your Swiftgoma account.",
          "If you believe that your account or authentication session has been accessed without authorization, you should contact Swiftgoma Support as soon as possible.",
        ],
      },
      {
        heading: "8. Other Cookies and Similar Technologies",
        paragraphs: [
          "Swiftgoma may introduce additional cookies or similar technologies in the future as new Platform features are introduced.",
          "Such technologies may be used to remember user preferences, improve Platform functionality, maintain security, understand Platform performance, or provide features that require information to be stored in your browser.",
          "For example, we use your browser's local storage — not a cookie, but a similar browser-based storage mechanism — to record the time your session was last refreshed. This lets multiple open tabs coordinate authentication without each one making a separate request, and stores nothing beyond that timestamp.",
          "If additional cookies are introduced, we may update these Cookie Terms to explain their purpose and how they are used.",
        ],
      },
      {
        heading: "9. Third-Party Services",
        paragraphs: [
          "Some services integrated into the Platform may be provided by third parties and may use their own cookies or similar technologies.",
          "The use of such technologies by third parties may be governed by the applicable privacy or cookie policies of those third parties.",
          "Swiftgoma does not control the cookie practices of third parties that operate independently from the Platform.",
        ],
      },
      {
        heading: "10. Managing Cookies",
        paragraphs: [
          "You can generally control or delete cookies through your web browser settings.",
          "However, disabling essential authentication cookies may prevent you from signing in, remaining signed in, accessing protected areas of the Platform, or using certain account-related features.",
          "Because authentication cookies are necessary for core Platform functionality, disabling them may significantly affect your experience.",
        ],
      },
      {
        heading: "11. Cookies and Personal Data",
        paragraphs: [
          "Some information associated with cookies may constitute personal data when it can be linked to your account or otherwise used to identify you.",
          "Swiftgoma handles personal information in accordance with our Privacy Policy.",
          "Authentication cookies are primarily used to securely maintain your session and authenticate requests to protected Platform resources.",
        ],
      },
      {
        heading: "12. Changes to These Cookie Terms",
        paragraphs: [
          'We may update these Cookie Terms from time to time to reflect changes to our authentication system, Platform features, security practices, technologies, or applicable law. We will update the "Last updated" date above.',
          "For material changes, we may provide additional notice such as an in-app notification, email, or another appropriate communication method.",
        ],
      },
      {
        heading: "13. Contact Us",
        paragraphs: [
          "For questions about these Cookie Terms or how Swiftgoma uses cookies, use the contact form below, write to info@swiftgoma.com, or reach us through the Contact/Support section of the Platform.",
        ],
      },
    ],
  },

  fr: {
    title: "Politique relative aux cookies",
    lastUpdated: `Dernière mise à jour : ${LAST_UPDATED.fr}`,
    intro: [
      "Les présentes Conditions relatives aux cookies (« Conditions cookies ») expliquent comment Swiftgoma (« Swiftgoma », « nous », « notre » ou « nos ») utilise les cookies et technologies similaires lorsque vous accédez à la Plateforme ou l’utilisez.",
      "Les cookies nous permettent notamment de fournir les fonctionnalités essentielles de la Plateforme, de maintenir des sessions d'authentification sécurisées, de conserver certaines informations et d'assurer le bon fonctionnement de la Plateforme. En utilisant Swiftgoma, vous reconnaissez que des cookies peuvent être utilisés conformément aux présentes Conditions cookies.",
    ],
    sections: [
      {
        heading: "1. Que sont les cookies ?",
        paragraphs: [
          "Les cookies sont de petits fichiers texte enregistrés sur votre appareil par un site web ou une application. Ils permettent à la Plateforme de reconnaître votre navigateur ou votre appareil et de conserver certaines informations entre différentes requêtes.",
          "Swiftgoma utilise principalement des cookies nécessaires à l'authentification, à la gestion des sessions, à la sécurité et au bon fonctionnement de la Plateforme.",
        ],
      },
      {
        heading: "2. Les cookies que nous utilisons",
        paragraphs: [
          "Swiftgoma utilise actuellement des cookies d'authentification pour gérer votre session de connexion et authentifier de manière sécurisée les requêtes vers les zones protégées de la Plateforme.",
        ],
      },
      {
        heading: "3. Cookies d'authentification",
        paragraphs: [
          "Swiftgoma utilise un cookie contenant un jeton d'accès afin d'authentifier les requêtes lorsque vous êtes connecté. Ce cookie possède une durée de vie courte et permet à la Plateforme de maintenir votre accès authentifié.",
          "Swiftgoma utilise également un cookie contenant un jeton de renouvellement afin d'obtenir un nouveau jeton d'accès lorsque le jeton actuel expire. Cela permet à votre session authentifiée de continuer sans vous obliger à vous reconnecter immédiatement.",
        ],
        bullets: [
          "`swg_access_token` — utilisé pour authentifier les requêtes effectuées lorsque vous êtes connecté.",
          "`swg_refresh_token` — utilisé pour renouveler votre session d'authentification lorsque le jeton d'accès expire.",
        ],
      },
      {
        heading: "4. Sécurité des cookies",
        paragraphs: [
          "Swiftgoma configure ses cookies d'authentification avec des mesures de sécurité destinées à contribuer à la protection de votre compte et de vos informations d'authentification.",
          "Les cookies d'authentification sont configurés avec l'attribut HttpOnly, ce qui signifie que le code JavaScript exécuté côté client ne peut pas lire directement leur contenu.",
          "Dans les environnements de production, les cookies d'authentification sont configurés avec l'attribut Secure, ce qui signifie qu'ils sont transmis uniquement via des connexions HTTPS sécurisées.",
          "Swiftgoma utilise également une politique SameSite afin de contribuer à réduire les risques de requêtes intersites non autorisées.",
        ],
      },
      {
        heading: "5. Durée de vie des cookies",
        paragraphs: [
          "La durée de vie de nos cookies d'authentification est liée à votre session d'authentification.",
          "Le cookie du jeton d'accès possède une durée de vie courte, actuellement de 15 minutes par défaut.",
          "Le cookie du jeton de renouvellement possède une durée de vie plus longue, actuellement de 30 jours par défaut.",
          "Ces durées peuvent être modifiées lorsque nous améliorons nos systèmes d'authentification, de sécurité et de gestion des sessions.",
          "Les cookies peuvent également être supprimés plus tôt lorsque vous vous déconnectez, lorsque votre session est révoquée ou lorsque votre session d'authentification devient invalide.",
        ],
      },
      {
        heading: "6. Cookies et session de connexion",
        paragraphs: [
          "Lorsque vous vous connectez à Swiftgoma, des cookies d'authentification peuvent être enregistrés sur votre appareil afin de maintenir votre session authentifiée.",
          "Ces cookies permettent à Swiftgoma de reconnaître les requêtes authentifiées sans vous demander de fournir vos identifiants de connexion à chaque requête.",
          "Si vous supprimez, bloquez ou empêchez l'enregistrement des cookies d'authentification essentiels, certaines fonctionnalités de votre compte peuvent ne plus fonctionner correctement et vous pourriez devoir vous reconnecter.",
        ],
      },
      {
        heading: "7. Cookies et sécurité du compte",
        paragraphs: [
          "Les cookies d'authentification constituent une partie importante du système de sécurité des comptes Swiftgoma.",
          "Swiftgoma peut invalider ou révoquer des sessions d'authentification lorsque cela est nécessaire pour des raisons de sécurité. Une fois une session révoquée ou expirée, les informations d'authentification associées ne peuvent plus être utilisées pour accéder au compte.",
          "Vous êtes responsable de la protection de l'accès à l'appareil et au navigateur que vous utilisez pour accéder à votre compte Swiftgoma.",
          "Si vous pensez que votre compte ou votre session d'authentification a été utilisé sans autorisation, vous devez contacter le Support Swiftgoma dès que possible.",
        ],
      },
      {
        heading: "8. Autres cookies et technologies similaires",
        paragraphs: [
          "Swiftgoma peut introduire à l'avenir des cookies supplémentaires ou des technologies similaires lorsque de nouvelles fonctionnalités de la Plateforme seront ajoutées.",
          "Ces technologies peuvent être utilisées pour mémoriser les préférences des utilisateurs, améliorer les fonctionnalités de la Plateforme, maintenir la sécurité, comprendre les performances de la Plateforme ou fournir des fonctionnalités nécessitant la conservation d'informations dans votre navigateur.",
          "Par exemple, nous utilisons le stockage local de votre navigateur — qui n'est pas un cookie, mais un mécanisme de stockage similaire basé sur le navigateur — pour enregistrer l'heure du dernier renouvellement de votre session. Cela permet à plusieurs onglets ouverts de coordonner l'authentification sans que chacun n'effectue une requête séparée, et ne conserve rien d'autre que cet horodatage.",
          "Si des cookies supplémentaires sont introduits, nous pouvons mettre à jour les présentes Conditions cookies afin d'expliquer leur finalité et leur utilisation.",
        ],
      },
      {
        heading: "9. Services tiers",
        paragraphs: [
          "Certains services intégrés à la Plateforme peuvent être fournis par des tiers et utiliser leurs propres cookies ou technologies similaires.",
          "L'utilisation de ces technologies par des tiers peut être régie par les politiques de confidentialité ou relatives aux cookies applicables de ces tiers.",
          "Swiftgoma ne contrôle pas les pratiques relatives aux cookies des tiers qui fonctionnent indépendamment de la Plateforme.",
        ],
      },
      {
        heading: "10. Gestion des cookies",
        paragraphs: [
          "Vous pouvez généralement contrôler ou supprimer les cookies à partir des paramètres de votre navigateur web.",
          "Cependant, la désactivation des cookies d'authentification essentiels peut vous empêcher de vous connecter, de rester connecté, d'accéder aux zones protégées de la Plateforme ou d'utiliser certaines fonctionnalités liées à votre compte.",
          "Les cookies d'authentification étant nécessaires au fonctionnement des principales fonctionnalités de la Plateforme, leur désactivation peut considérablement affecter votre expérience.",
        ],
      },
      {
        heading: "11. Cookies et données personnelles",
        paragraphs: [
          "Certaines informations associées aux cookies peuvent constituer des données personnelles lorsqu'elles peuvent être liées à votre compte ou utilisées pour vous identifier.",
          "Swiftgoma traite les informations personnelles conformément à notre Politique de confidentialité.",
          "Les cookies d'authentification sont principalement utilisés pour maintenir de manière sécurisée votre session et authentifier les requêtes vers les ressources protégées de la Plateforme.",
        ],
      },
      {
        heading: "12. Modifications des présentes Conditions cookies",
        paragraphs: [
          "Nous pouvons mettre à jour les présentes Conditions cookies de temps à autre afin de refléter les changements apportés à notre système d’authentification, aux fonctionnalités de la Plateforme, à nos pratiques de sécurité, aux technologies utilisées ou à la législation applicable. Nous mettrons à jour la date de « Dernière mise à jour » ci-dessus.",
          "Pour les modifications importantes, nous pouvons fournir un avis supplémentaire tel qu'une notification in-app, un e-mail ou tout autre moyen de communication approprié.",
        ],
      },
      {
        heading: "13. Nous contacter",
        paragraphs: [
          "Pour toute question concernant les présentes Conditions cookies ou la manière dont Swiftgoma utilise les cookies, utilisez le formulaire de contact ci-dessous, écrivez à info@swiftgoma.com, ou contactez-nous via la section Contact/Support de la Plateforme.",
        ],
      },
    ],
  },
};

export default async function RiderTermsPage() {
  const locale = await getServerLocale();
  const content = COOKIE_TERMS_CONTENT[locale];

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
