import type { Locale } from "@/lib/language";

export type BlogPostTemplate = {
  id: string;
  title: Record<Locale, string>;
  slug: string;
  excerpt: Record<Locale, string>;
  content: Record<Locale, string>;
  coverImageUrl: string;
  publishedAt: string;
  author: {
    name: string;
  };
};

export const BLOG_POST_TEMPLATES: BlogPostTemplate[] = [
  {
    id: "1",
    slug: "how-swiftgoma-is-changing-shopping-in-goma",

    title: {
      en: "How Swiftgoma is changing the way people shop in Goma",
      fr: "Comment Swiftgoma change la façon de faire ses achats à Goma",
    },

    excerpt: {
      en: "From discovering local products to receiving an order at your door, Swiftgoma brings buyers, sellers, and riders together in one connected marketplace built for Goma.",
      fr: "De la découverte des produits locaux à la réception d'une commande à domicile, Swiftgoma réunit acheteurs, vendeurs et livreurs au sein d'une marketplace pensée pour Goma.",
    },

    coverImageUrl:
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85",

    publishedAt: "2026-08-20T10:00:00.000Z",

    author: {
      name: "Swiftgoma Team",
    },

    content: {
      en: `
        <p>
          Buying something you need should not have to mean spending hours
          moving from one shop to another, searching for a product, asking
          whether it is available, and figuring out how to get it home.
        </p>

        <p>
          Yet for many people, local commerce still happens through
          disconnected experiences. Sellers have products, buyers have needs,
          and riders can move goods from one place to another — but these
          three parts of the journey are not always connected.
        </p>

        <p>
          <strong>Swiftgoma was created to bring those pieces together.</strong>
        </p>

        <h2>A marketplace built for Goma</h2>

        <p>
          Swiftgoma is a local marketplace and delivery platform designed
          specifically for Goma. Instead of trying to replace the local
          businesses people already know, the platform gives those businesses
          better digital tools to reach customers and manage orders.
        </p>

        <p>
          Buyers can discover products from local sellers, compare what is
          available, place orders, choose how they want to receive them, and
          follow the progress of their order.
        </p>

        <p>
          Sellers, meanwhile, get a dedicated environment where they can
          manage products, process orders, work with their riders, and track
          their business activity.
        </p>

        <h2>Three people, one connected experience</h2>

        <p>
          At the heart of Swiftgoma are three groups:
        </p>

        <ul>
          <li>
            <strong>Buyers</strong> discover products and place orders.
          </li>
          <li>
            <strong>Sellers</strong> manage products, accept orders and prepare
            them for fulfillment.
          </li>
          <li>
            <strong>Riders</strong> handle delivery for the sellers they work
            with.
          </li>
        </ul>

        <p>
          Connecting these roles makes the entire process easier to follow.
          Everyone knows what needs to happen next, from the moment an order
          is created until it reaches the buyer.
        </p>

        <blockquote>
          Local commerce becomes more powerful when the technology works around
          the way people already do business.
        </blockquote>

        <h2>Delivery or pickup — you choose</h2>

        <p>
          Not every customer wants the same fulfillment experience.
        </p>

        <p>
          Some buyers want their order delivered to them. Others may prefer to
          pick it up directly from the seller.
        </p>

        <p>
          Swiftgoma keeps these choices separate from payment. At checkout,
          buyers can choose the fulfillment method that works best for them.
        </p>

        <h3>Delivery</h3>

        <p>
          When delivery is selected, the seller can assign the order to one of
          their affiliated riders. The rider receives the delivery request,
          navigates to the buyer, and confirms the handoff when the order is
          delivered.
        </p>

        <h3>Pickup</h3>

        <p>
          Buyers who prefer pickup can collect their order directly from the
          seller. The same handoff confirmation system helps confirm that the
          order has been successfully collected.
        </p>

        <h2>Trust is part of the experience</h2>

        <p>
          Technology alone does not create trust. The experience around the
          technology matters just as much.
        </p>

        <p>
          That is why Swiftgoma uses a QR-based handoff confirmation for every
          order. Each order has a unique, one-time QR code that is used when
          the order is handed over.
        </p>

        <p>
          For delivery, the rider scans the buyer's QR code. For pickup, the
          appropriate seller-side flow confirms the handoff.
        </p>

        <p>
          This creates a clear event in the order lifecycle: the order has
          actually reached the buyer.
        </p>

        <h2>Payments designed around local reality</h2>

        <p>
          Goma is a market where cash remains an important part of everyday
          commerce. Swiftgoma is built around that reality instead of ignoring
          it.
        </p>

        <p>
          Buyers can choose between:
        </p>

        <ul>
          <li>Cash on Delivery</li>
          <li>Online Payment</li>
          <li>Swiftgoma Wallet</li>
        </ul>

        <p>
          Online payments can use an escrow flow. The payment remains protected
          until the order handoff is confirmed, after which the settlement
          process can release the seller's payout.
        </p>

        <h2>Built to support local businesses</h2>

        <p>
          Swiftgoma is not simply another shopping application. The goal is to
          create infrastructure that helps local businesses participate in
          digital commerce without losing control of their operations.
        </p>

        <p>
          Sellers keep responsibility for their own business and riders.
          Swiftgoma provides the technology connecting the different parts of
          the customer journey.
        </p>

        <h2>What's next?</h2>

        <p>
          Swiftgoma is still growing. As the platform evolves, the focus
          remains the same: make local commerce easier to discover, easier to
          manage, and easier to trust.
        </p>

        <p>
          For buyers, that means a simpler way to find what they need.
          For sellers, better tools to grow their business. And for riders,
          clearer delivery workflows.
        </p>

        <p>
          <strong>
            The future of local commerce starts with making today's commerce
            work better.
          </strong>
        </p>
      `,

      fr: `
        <p>
          Acheter ce dont on a besoin ne devrait pas nécessiter de passer des
          heures à parcourir plusieurs boutiques, rechercher un produit,
          vérifier sa disponibilité et trouver comment le ramener chez soi.
        </p>

        <p>
          Pourtant, une grande partie du commerce local repose encore sur des
          expériences séparées. Les vendeurs ont les produits, les acheteurs
          ont des besoins et les livreurs peuvent transporter les marchandises,
          mais ces trois éléments ne sont pas toujours connectés.
        </p>

        <p>
          <strong>Swiftgoma a été créé pour réunir ces différentes étapes.</strong>
        </p>

        <h2>Une marketplace pensée pour Goma</h2>

        <p>
          Swiftgoma est une marketplace locale et une plateforme de livraison
          conçue pour Goma. L'objectif n'est pas de remplacer les commerces
          locaux que les habitants connaissent déjà, mais de leur fournir de
          meilleurs outils numériques pour atteindre leurs clients et gérer
          leurs commandes.
        </p>

        <p>
          Les acheteurs peuvent découvrir les produits des vendeurs locaux,
          passer commande, choisir leur mode de réception et suivre l'évolution
          de leur commande.
        </p>

        <p>
          Les vendeurs disposent également d'un environnement dédié pour gérer
          leurs produits, leurs commandes, leurs livreurs et leur activité.
        </p>

        <h2>Trois acteurs, une seule expérience</h2>

        <p>
          Swiftgoma repose sur trois groupes principaux :
        </p>

        <ul>
          <li>
            <strong>Les acheteurs</strong> découvrent les produits et passent
            leurs commandes.
          </li>
          <li>
            <strong>Les vendeurs</strong> gèrent leurs produits, acceptent les
            commandes et les préparent.
          </li>
          <li>
            <strong>Les livreurs</strong> assurent la livraison pour les
            vendeurs auxquels ils sont affiliés.
          </li>
        </ul>

        <blockquote>
          Le commerce local devient plus puissant lorsque la technologie
          s'adapte à la manière dont les entreprises travaillent déjà.
        </blockquote>

        <h2>Livraison ou retrait : vous choisissez</h2>

        <p>
          Tous les clients n'ont pas les mêmes besoins.
        </p>

        <p>
          Certains souhaitent recevoir leur commande à domicile, tandis que
          d'autres préfèrent la récupérer directement auprès du vendeur.
        </p>

        <p>
          Swiftgoma permet de choisir le mode de réception indépendamment du
          mode de paiement.
        </p>

        <h2>La confiance au cœur de l'expérience</h2>

        <p>
          La technologie seule ne suffit pas à créer la confiance. C'est
          l'ensemble de l'expérience qui compte.
        </p>

        <p>
          Swiftgoma utilise donc un système de confirmation par QR code.
          Chaque commande possède un code unique utilisé au moment de la
          remise.
        </p>

        <p>
          Pour une livraison, le livreur scanne le QR code de l'acheteur.
          Pour un retrait, le processus de remise permet également de confirmer
          que la commande a bien été récupérée.
        </p>

        <h2>Des paiements adaptés à la réalité locale</h2>

        <p>
          L'argent liquide reste une partie importante du commerce quotidien
          à Goma. Swiftgoma a été conçu en tenant compte de cette réalité.
        </p>

        <ul>
          <li>Paiement à la livraison</li>
          <li>Paiement en ligne</li>
          <li>Swiftgoma Wallet</li>
        </ul>

        <p>
          Pour les paiements en ligne, un système de séquestre peut protéger
          le paiement jusqu'à la confirmation de la remise de la commande.
        </p>

        <h2>Une plateforme au service des commerces locaux</h2>

        <p>
          Swiftgoma n'est pas simplement une application de shopping.
          L'objectif est de créer une infrastructure permettant aux commerces
          locaux de participer au commerce numérique tout en conservant le
          contrôle de leurs opérations.
        </p>

        <h2>Et maintenant ?</h2>

        <p>
          Swiftgoma continue d'évoluer avec un objectif simple : rendre le
          commerce local plus facile à découvrir, plus simple à gérer et plus
          fiable.
        </p>

        <p>
          Pour les acheteurs, cela signifie une manière plus simple de trouver
          ce dont ils ont besoin. Pour les vendeurs, de meilleurs outils pour
          développer leur activité. Et pour les livreurs, des processus plus
          clairs.
        </p>

        <p>
          <strong>
            L'avenir du commerce local commence par rendre le commerce
            d'aujourd'hui plus simple.
          </strong>
        </p>
      `,
    },
  },

  {
    id: "2",
    slug: "a-better-way-to-support-local-sellers",

    title: {
      en: "A better way to support local sellers",
      fr: "Une meilleure façon de soutenir les vendeurs locaux",
    },

    excerpt: {
      en: "Local businesses already power Goma's economy. Swiftgoma gives them the digital tools they need to become easier to discover, manage, and grow.",
      fr: "Les commerces locaux font déjà vivre l'économie de Goma. Swiftgoma leur apporte les outils numériques nécessaires pour être plus visibles, mieux gérer leur activité et grandir.",
    },

    coverImageUrl:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=85",

    publishedAt: "2026-08-16T10:00:00.000Z",

    author: {
      name: "Swiftgoma Team",
    },

    content: {
      en: `
        <p>
          Behind every successful order is a seller who found a product,
          invested in inventory, opened a shop, served customers and built a
          business.
        </p>

        <p>
          Local sellers are already at the heart of Goma's economy. The
          challenge is not whether local businesses can create value. The
          challenge is giving them better tools to make that value easier to
          discover and easier to deliver.
        </p>

        <h2>The seller should remain in control</h2>

        <p>
          Swiftgoma is designed around a simple principle:
          <strong>technology should support the seller, not take control away from them.</strong>
        </p>

        <p>
          Sellers remain responsible for their products, orders, customers,
          operations and riders. Swiftgoma provides the infrastructure that
          connects these activities to buyers.
        </p>

        <p>
          This means a seller can build their presence on the marketplace while
          continuing to operate their business in the way that makes sense for
          them.
        </p>

        <h2>One place to manage products and orders</h2>

        <p>
          Managing a business through scattered messages and manual processes
          can quickly become difficult as the number of customers increases.
        </p>

        <p>
          Swiftgoma gives sellers a dedicated application where they can
          manage their catalog and respond to orders.
        </p>

        <ul>
          <li>Create and manage product listings.</li>
          <li>Receive new orders.</li>
          <li>Accept or reject orders.</li>
          <li>Prepare orders for pickup or delivery.</li>
          <li>Manage affiliated riders.</li>
          <li>Track payouts and business activity.</li>
        </ul>

        <h2>Helping customers discover local businesses</h2>

        <p>
          A great product is not useful to a customer if they cannot find it.
        </p>

        <p>
          Swiftgoma gives local sellers another channel through which buyers
          can discover their products.
        </p>

        <p>
          Instead of depending only on physical foot traffic, sellers can
          present their products in a digital marketplace where customers can
          browse from wherever they are.
        </p>

        <blockquote>
          Digital visibility should create more opportunities for local
          businesses, not replace the businesses themselves.
        </blockquote>

        <h2>Sellers and riders work together</h2>

        <p>
          Swiftgoma takes a different approach to delivery.
        </p>

        <p>
          Riders belong to sellers rather than to Swiftgoma. A seller can
          invite and manage the riders who work with their business.
        </p>

        <p>
          Swiftgoma provides the technology that connects the seller, rider
          and buyer during the delivery process.
        </p>

        <p>
          This keeps the relationship between the seller and their riders
          clear while giving everyone the tools needed to coordinate an order.
        </p>

        <h2>0% commission on orders</h2>

        <p>
          One of Swiftgoma's most important principles is its
          <strong>0% commission on orders</strong>.
        </p>

        <p>
          The platform does not take a percentage from every sale made by a
          seller.
        </p>

        <p>
          Instead, Swiftgoma's revenue comes primarily from seller
          subscriptions and Swiftgoma Wallet transactions.
        </p>

        <p>
          This model is designed to make the platform predictable for sellers
          while allowing Swiftgoma to invest in the infrastructure that powers
          the marketplace.
        </p>

        <h2>Built for growth</h2>

        <p>
          A seller might start with a small catalog and a few orders every
          week. Over time, that can grow into hundreds of products and a much
          larger customer base.
        </p>

        <p>
          The technology behind Swiftgoma is designed to support that journey.
          Sellers can progressively build their digital presence without
          needing to build their own marketplace infrastructure.
        </p>

        <h2>The bigger picture</h2>

        <p>
          Supporting local sellers means more than giving them an online
          storefront.
        </p>

        <p>
          It means creating a connected system where customers can discover
          them, place orders, receive their products and build confidence in
          the process.
        </p>

        <p>
          <strong>
            When local sellers have better tools, the entire local commerce
            ecosystem becomes stronger.
          </strong>
        </p>
      `,

      fr: `
        <p>
          Derrière chaque commande réussie se trouve un vendeur qui a investi
          dans ses produits, ouvert son commerce, servi ses clients et construit
          son activité.
        </p>

        <p>
          Les vendeurs locaux sont déjà au cœur de l'économie de Goma.
          Le défi n'est donc pas de créer leur valeur, mais de leur donner de
          meilleurs outils pour rendre cette valeur plus visible et plus
          accessible.
        </p>

        <h2>Le vendeur reste maître de son activité</h2>

        <p>
          Swiftgoma repose sur un principe simple :
          <strong>la technologie doit accompagner le vendeur, pas prendre le contrôle de son activité.</strong>
        </p>

        <p>
          Les vendeurs restent responsables de leurs produits, commandes,
          clients, opérations et livreurs.
        </p>

        <p>
          Swiftgoma fournit l'infrastructure qui permet de connecter ces
          activités aux acheteurs.
        </p>

        <h2>Gérer produits et commandes au même endroit</h2>

        <p>
          Gérer une activité à travers plusieurs messages et processus
          manuels devient rapidement difficile lorsque le nombre de clients
          augmente.
        </p>

        <p>
          L'application vendeur de Swiftgoma permet de gérer le catalogue et
          les commandes depuis un espace dédié.
        </p>

        <ul>
          <li>Créer et gérer des produits.</li>
          <li>Recevoir de nouvelles commandes.</li>
          <li>Accepter ou refuser une commande.</li>
          <li>Préparer les commandes pour livraison ou retrait.</li>
          <li>Gérer ses propres livreurs.</li>
          <li>Suivre les paiements et l'activité.</li>
        </ul>

        <h2>Donner plus de visibilité aux commerces locaux</h2>

        <p>
          Un bon produit n'a de valeur pour un client que s'il peut le trouver.
        </p>

        <p>
          Swiftgoma offre aux vendeurs locaux un nouveau canal permettant aux
          acheteurs de découvrir leurs produits.
        </p>

        <p>
          Au lieu de dépendre uniquement du passage physique des clients,
          les vendeurs peuvent présenter leurs produits dans une marketplace
          accessible depuis leur téléphone.
        </p>

        <blockquote>
          La visibilité numérique doit créer davantage d'opportunités pour les
          commerces locaux, et non les remplacer.
        </blockquote>

        <h2>Les vendeurs et les livreurs travaillent ensemble</h2>

        <p>
          Swiftgoma adopte une approche différente de la livraison.
        </p>

        <p>
          Les livreurs appartiennent aux vendeurs et non à Swiftgoma.
          Un vendeur peut inviter et gérer les livreurs qui travaillent avec
          son commerce.
        </p>

        <p>
          Swiftgoma fournit la technologie permettant de connecter vendeur,
          livreur et acheteur pendant le processus de livraison.
        </p>

        <h2>0 % de commission sur les commandes</h2>

        <p>
          L'un des principes importants de Swiftgoma est la
          <strong>commission de 0 % sur les commandes</strong>.
        </p>

        <p>
          La plateforme ne prélève pas un pourcentage sur chaque vente réalisée
          par un vendeur.
        </p>

        <p>
          Les revenus de Swiftgoma proviennent principalement des abonnements
          vendeurs et des transactions effectuées avec Swiftgoma Wallet.
        </p>

        <h2>Une plateforme pensée pour grandir</h2>

        <p>
          Un vendeur peut commencer avec quelques produits et quelques
          commandes par semaine, puis développer progressivement son activité.
        </p>

        <p>
          Swiftgoma fournit l'infrastructure nécessaire pour accompagner cette
          évolution sans obliger chaque vendeur à créer sa propre marketplace.
        </p>

        <h2>Une vision plus large</h2>

        <p>
          Soutenir les vendeurs locaux signifie plus que leur donner une
          boutique en ligne.
        </p>

        <p>
          Il s'agit de créer un système connecté dans lequel les clients
          peuvent découvrir les commerces, commander, recevoir leurs produits
          et avoir davantage confiance dans le processus.
        </p>

        <p>
          <strong>
            Lorsque les vendeurs locaux disposent de meilleurs outils,
            tout l'écosystème du commerce local devient plus fort.
          </strong>
        </p>
      `,
    },
  },

  {
    id: "3",
    slug: "how-qr-handoff-makes-orders-more-trustworthy",

    title: {
      en: "How QR handoff makes orders more trustworthy",
      fr: "Comment la remise par QR code renforce la confiance",
    },

    excerpt: {
      en: "The final handoff is one of the most important moments in an online order. Here's how Swiftgoma uses one-time QR codes to make that moment clearer and more reliable.",
      fr: "La remise est l'un des moments les plus importants d'une commande en ligne. Découvrez comment Swiftgoma utilise des QR codes uniques pour rendre cette étape plus claire et plus fiable.",
    },

    coverImageUrl:
      "https://images.unsplash.com/photo-1595079676339-1534801ad6cf?auto=format&fit=crop&w=1600&q=85",

    publishedAt: "2026-08-12T10:00:00.000Z",

    author: {
      name: "Swiftgoma Team",
    },

    content: {
      en: `
        <p>
          An online order does not truly feel complete when a seller accepts
          it. It is not complete when a rider picks it up either.
        </p>

        <p>
          The most important moment happens when the product actually reaches
          the buyer.
        </p>

        <p>
          That final handoff is where expectations become reality. Swiftgoma
          designed its QR confirmation system around this exact moment.
        </p>

        <h2>What is a QR handoff?</h2>

        <p>
          A QR handoff is a digital confirmation that an order has been
          successfully transferred to the buyer.
        </p>

        <p>
          Every order receives a unique QR code. The buyer presents that code
          when the order is handed over, and the appropriate party scans it to
          confirm the transaction.
        </p>

        <p>
          The purpose is simple: create a clear and reliable signal that the
          physical handoff has happened.
        </p>

        <h2>Why does the handoff matter?</h2>

        <p>
          An order can go through many stages before it reaches the customer.
        </p>

        <ol>
          <li>The buyer places the order.</li>
          <li>The seller receives the order.</li>
          <li>The seller accepts and prepares it.</li>
          <li>Fulfillment begins.</li>
          <li>The order reaches the buyer.</li>
          <li>The handoff is confirmed.</li>
        </ol>

        <p>
          The final confirmation provides an important transition between the
          physical delivery process and the digital order record.
        </p>

        <blockquote>
          The QR scan is more than a code — it is the digital confirmation of
          the physical handoff.
        </blockquote>

        <h2>One order, one QR code</h2>

        <p>
          Each order has its own QR code. This means the confirmation is tied
          directly to that specific order instead of relying on a generic
          confirmation process.
        </p>

        <p>
          The buyer does not need to remember an order number or manually
          confirm that the delivery happened. The QR code provides a simple
          interaction at the moment it matters.
        </p>

        <h2>Delivery and pickup</h2>

        <p>
          Swiftgoma supports two fulfillment methods: delivery and pickup.
        </p>

        <h3>For delivery</h3>

        <p>
          The rider arrives with the order and the buyer presents their QR
          code. The rider scans it to confirm the handoff.
        </p>

        <h3>For pickup</h3>

        <p>
          The buyer visits the seller and the appropriate seller-side flow is
          used to confirm that the order has been collected.
        </p>

        <p>
          In both cases, the goal is the same: establish a clear confirmation
          that the buyer has received the order.
        </p>

        <h2>How this connects to online payments</h2>

        <p>
          The QR handoff becomes particularly important when online payment is
          used.
        </p>

        <p>
          Instead of treating payment and fulfillment as completely separate
          events, Swiftgoma can connect them through the order lifecycle.
        </p>

        <p>
          When an online payment is placed into escrow, the seller's payout can
          remain pending until the handoff is confirmed.
        </p>

        <p>
          Once the QR handoff is successfully confirmed, the settlement process
          can release the payout to the seller.
        </p>

        <h2>Why escrow matters</h2>

        <p>
          Escrow creates an additional layer of protection around online
          transactions.
        </p>

        <p>
          The payment is not treated as fully settled simply because the buyer
          clicked a payment button. The order still needs to move through the
          fulfillment process.
        </p>

        <p>
          This creates a stronger connection between payment, fulfillment and
          delivery confirmation.
        </p>

        <h2>Making the order lifecycle clearer</h2>

        <p>
          Good technology should reduce uncertainty.
        </p>

        <p>
          A buyer should be able to understand where their order is. A seller
          should know whether an order has been fulfilled. A rider should know
          what action is required to complete the delivery.
        </p>

        <p>
          The QR handoff is one piece of that larger system.
        </p>

        <h2>Designed for real-world commerce</h2>

        <p>
          Swiftgoma is being built for the realities of local commerce in Goma.
          That means designing systems that are easy to understand and useful
          during real interactions between buyers, sellers and riders.
        </p>

        <p>
          A QR code is simple technology, but its value comes from where it is
          used: at the exact moment when an order changes hands.
        </p>

        <h2>The bigger idea</h2>

        <p>
          Trust in e-commerce is built through many small details.
        </p>

        <p>
          Clear order statuses, reliable communication, payment protection,
          delivery tracking and confirmation at handoff all contribute to the
          same goal.
        </p>

        <p>
          <strong>
            Swiftgoma uses the QR handoff to make one of the most important
            moments in the buying journey simple, visible and verifiable.
          </strong>
        </p>
      `,

      fr: `
        <p>
          Une commande en ligne n'est pas réellement terminée lorsque le
          vendeur l'accepte. Elle ne l'est pas non plus lorsque le livreur la
          récupère.
        </p>

        <p>
          Le moment le plus important arrive lorsque le produit atteint
          réellement l'acheteur.
        </p>

        <p>
          Cette remise finale est le moment où les attentes deviennent
          réalité. Swiftgoma a conçu son système de confirmation QR autour de
          cette étape.
        </p>

        <h2>Qu'est-ce qu'une remise par QR code ?</h2>

        <p>
          La remise par QR code est une confirmation numérique indiquant qu'une
          commande a bien été remise à l'acheteur.
        </p>

        <p>
          Chaque commande possède un QR code unique. L'acheteur présente ce
          code au moment de la remise et le système approprié le scanne pour
          confirmer la transaction.
        </p>

        <p>
          L'objectif est simple : créer un signal clair et fiable indiquant que
          la remise physique a bien eu lieu.
        </p>

        <h2>Pourquoi la remise est-elle importante ?</h2>

        <p>
          Une commande peut passer par plusieurs étapes avant d'arriver chez
          le client.
        </p>

        <ol>
          <li>L'acheteur passe la commande.</li>
          <li>Le vendeur reçoit la commande.</li>
          <li>Le vendeur l'accepte et la prépare.</li>
          <li>La livraison ou le retrait commence.</li>
          <li>La commande arrive chez l'acheteur.</li>
          <li>La remise est confirmée.</li>
        </ol>

        <p>
          La confirmation finale crée un lien important entre le processus
          physique de livraison et l'enregistrement numérique de la commande.
        </p>

        <blockquote>
          Le scan QR est plus qu'un simple code : c'est la confirmation
          numérique de la remise physique.
        </blockquote>

        <h2>Une commande, un QR code</h2>

        <p>
          Chaque commande possède son propre QR code. La confirmation est ainsi
          directement liée à la commande concernée.
        </p>

        <p>
          L'acheteur n'a pas besoin de mémoriser un numéro de commande ou de
          réaliser plusieurs étapes manuellement. Le QR code permet une
          interaction simple au moment où elle est nécessaire.
        </p>

        <h2>Livraison et retrait</h2>

        <p>
          Swiftgoma prend en charge deux méthodes de réception : la livraison
          et le retrait.
        </p>

        <h3>Pour une livraison</h3>

        <p>
          Le livreur arrive avec la commande et l'acheteur présente son QR
          code. Le livreur le scanne afin de confirmer la remise.
        </p>

        <h3>Pour un retrait</h3>

        <p>
          L'acheteur se rend chez le vendeur et le processus prévu côté vendeur
          permet de confirmer que la commande a été récupérée.
        </p>

        <p>
          Dans les deux cas, l'objectif reste le même : confirmer clairement
          que l'acheteur a reçu sa commande.
        </p>

        <h2>Le lien avec les paiements en ligne</h2>

        <p>
          La confirmation QR devient particulièrement importante lorsqu'un
          paiement en ligne est utilisé.
        </p>

        <p>
          Lorsqu'un paiement est placé en séquestre, le paiement du vendeur
          peut rester en attente jusqu'à la confirmation de la remise.
        </p>

        <p>
          Une fois la remise confirmée par QR code, le processus de règlement
          peut libérer le paiement destiné au vendeur.
        </p>

        <h2>Pourquoi utiliser un séquestre ?</h2>

        <p>
          Le séquestre ajoute une couche de protection aux transactions en
          ligne.
        </p>

        <p>
          Le paiement n'est pas considéré comme complètement réglé simplement
          parce que l'acheteur a effectué le paiement. La commande doit encore
          passer par son processus de livraison ou de retrait.
        </p>

        <p>
          Cela permet de créer un lien plus fort entre paiement, fulfillment et
          confirmation de remise.
        </p>

        <h2>Rendre le cycle de commande plus clair</h2>

        <p>
          Une bonne technologie doit réduire l'incertitude.
        </p>

        <p>
          L'acheteur doit comprendre où se trouve sa commande. Le vendeur doit
          savoir si elle a été remise. Le livreur doit savoir quelle action
          permet de terminer la livraison.
        </p>

        <p>
          Le système de remise QR constitue une pièce importante de cet
          ensemble.
        </p>

        <h2>Pensé pour le commerce réel</h2>

        <p>
          Swiftgoma est conçu pour les réalités du commerce local à Goma.
          Cela signifie créer des systèmes simples à comprendre et utiles lors
          des interactions réelles entre acheteurs, vendeurs et livreurs.
        </p>

        <p>
          Le QR code est une technologie simple, mais sa valeur vient du moment
          où il est utilisé : lorsque la commande change réellement de mains.
        </p>

        <h2>L'idée derrière tout cela</h2>

        <p>
          La confiance dans le commerce électronique se construit à travers
          de nombreux détails.
        </p>

        <p>
          Des statuts de commande clairs, une bonne communication, la
          protection des paiements, le suivi de livraison et la confirmation
          de remise participent tous au même objectif.
        </p>

        <p>
          <strong>
            Swiftgoma utilise la remise par QR code pour rendre l'un des
            moments les plus importants du parcours d'achat simple, visible et
            vérifiable.
          </strong>
        </p>
      `,
    },
  },
];
