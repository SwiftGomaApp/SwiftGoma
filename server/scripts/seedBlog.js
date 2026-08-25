const { getPrismaClient } = require("../src/config/prisma");

function guardProduction() {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_SEED !== "true") {
    console.error("Refusing to seed blog posts in production. Set ALLOW_PROD_SEED=true to continue.");
    process.exit(1);
  }
}

const POSTS = [
  {
    slug: "mieux-acheter-local-a-goma",
    title: "Mieux acheter local à Goma : les petits gestes qui font la différence",
    excerpt: "Acheter près de chez soi peut être plus simple, plus fiable et plus utile pour toute la ville. Voici comment faire des choix locaux au quotidien.",
    coverImageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=85",
    publishedAt: new Date("2026-08-20T09:00:00.000Z"),
    content: `<p>À Goma, trouver un produit ne devrait pas demander une journée entière. Pourtant, entre les déplacements, les appels et les informations incomplètes, un achat aussi simple qu'un panier de courses ou un accessoire pour la maison peut vite prendre du temps.</p><p>Le commerce local numérique ne remplace pas les boutiques du quartier. Il aide surtout les clients à mieux les découvrir et à mieux préparer leurs achats.</p><h2>Commencer par comparer avant de se déplacer</h2><p>Avant de partir, prenez quelques minutes pour consulter les produits disponibles, les photos, les prix et les informations du vendeur. Cela évite les déplacements inutiles et permet de choisir avec plus de confiance.</p><p>Une fiche produit claire doit répondre aux questions les plus importantes : quel est le produit, combien coûte-t-il, est-il en stock et comment peut-on le recevoir ?</p><h2>Choisir le mode de réception qui vous convient</h2><p>Selon votre journée, la livraison peut être la solution la plus pratique. Mais le retrait en boutique reste une excellente option quand vous êtes déjà dans le quartier ou quand vous souhaitez vérifier un produit sur place.</p><ul><li><strong>Livraison :</strong> idéale lorsque le temps manque ou que le produit est encombrant.</li><li><strong>Retrait :</strong> pratique pour récupérer une commande au moment qui vous arrange.</li><li><strong>Paiement :</strong> choisissez l'option disponible qui correspond à votre situation.</li></ul><blockquote>Chaque achat local est aussi une occasion de faire grandir les services et les emplois qui existent déjà dans notre ville.</blockquote><h2>Donner un retour utile aux vendeurs</h2><p>Un avis honnête, une question posée avec précision ou un signalement sur une information manquante peut améliorer l'expérience de tous les prochains clients. Les bons vendeurs utilisent ces retours pour mieux présenter leurs produits et mieux organiser leurs commandes.</p><p>En achetant localement avec attention, vous gagnez du temps tout en soutenant des commerçants qui connaissent vos besoins et votre quartier.</p>`,
  },
  {
    slug: "preparer-sa-boutique-pour-les-commandes-en-ligne",
    title: "Préparer sa boutique pour recevoir des commandes en ligne",
    excerpt: "Des photos soignées, un stock à jour et une réponse rapide : les fondamentaux pour donner confiance aux clients et bien gérer ses premières commandes.",
    coverImageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1600&q=85",
    publishedAt: new Date("2026-08-16T09:00:00.000Z"),
    content: `<p>Une boutique en ligne ne demande pas un grand studio ni une équipe technique. Elle commence par des informations fiables. Lorsqu'un client voit un produit, il doit pouvoir comprendre immédiatement ce qu'il achète et savoir s'il peut compter sur votre boutique.</p><h2>Soigner les fiches produits</h2><p>Utilisez un nom précis, indiquez le format ou la taille et ajoutez une courte description utile. Une bonne photo prise à la lumière du jour est souvent plus efficace qu'une image trop retouchée.</p><ul><li>Montrez le produit sous au moins un angle clair.</li><li>Indiquez le prix final et les variantes disponibles.</li><li>Mettez à jour le stock dès qu'un article n'est plus disponible.</li></ul><h2>Organiser la préparation des commandes</h2><p>Dès qu'une commande arrive, vérifiez sa disponibilité avant de la confirmer. Préparez ensuite le produit avec soin : emballage propre, article complet et informations de retrait ou de livraison bien comprises.</p><p>Un petit espace réservé aux commandes prêtes à partir peut éviter beaucoup de confusion pendant les heures chargées. Si vous travaillez avec un livreur, convenez d'un point de collecte simple et d'une personne responsable de la remise.</p><h2>Répondre rapidement, même quand la réponse est courte</h2><p>Les clients n'attendent pas une longue conversation. Ils veulent surtout savoir si leur commande est confirmée, en préparation ou en route. Une communication rapide réduit les annulations et renforce la confiance.</p><blockquote>La régularité vaut mieux que la perfection : une boutique claire et réactive devient naturellement une boutique recommandée.</blockquote><h2>Construire la confiance dans la durée</h2><p>Après chaque commande, prenez note des questions qui reviennent. Elles montrent souvent ce qu'il faut améliorer dans vos fiches ou dans votre manière de préparer les produits. Avec le temps, cette attention se transforme en une expérience plus fluide, pour vous comme pour vos clients.</p>`,
  },
  {
    slug: "livraison-et-retrait-choisir-la-bonne-option",
    title: "Livraison ou retrait : choisir la bonne option pour chaque commande",
    excerpt: "Les deux options ont leur place. Découvrez comment choisir la réception la plus adaptée selon le produit, le temps disponible et votre localisation.",
    coverImageUrl: "https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1600&q=85",
    publishedAt: new Date("2026-08-10T09:00:00.000Z"),
    content: `<p>Le meilleur mode de réception est celui qui s'adapte à votre journée. Certaines commandes doivent arriver à la maison, d'autres sont plus simples à récupérer près de votre trajet habituel. Sur Swiftgoma, livraison et retrait répondent à ces deux besoins.</p><h2>Quand choisir la livraison ?</h2><p>La livraison est particulièrement utile pour les achats volumineux, les commandes regroupées ou les journées où vous ne pouvez pas vous déplacer. Elle permet aussi de faire venir un produit depuis un autre quartier sans interrompre votre travail.</p><p>Avant de confirmer, indiquez une adresse claire et gardez votre téléphone accessible. Si un repère connu peut aider le livreur, ajoutez-le dans les instructions.</p><h2>Quand préférer le retrait ?</h2><p>Le retrait est souvent la meilleure solution quand vous passez déjà à proximité de la boutique. Il vous donne plus de souplesse sur l'heure de récupération et peut être pratique pour les produits que vous souhaitez voir avant de repartir.</p><ul><li>Vérifiez les horaires de la boutique avant de vous déplacer.</li><li>Attendez la confirmation que la commande est prête.</li><li>Gardez les détails de la commande à portée de main lors du retrait.</li></ul><h2>La remise confirme la bonne réception</h2><p>Qu'il s'agisse d'une livraison ou d'un retrait, la dernière étape compte. Prenez un instant pour vérifier que la commande est complète avant de confirmer la remise. Cette habitude simple protège à la fois le client, le vendeur et le livreur.</p><blockquote>Une commande bien terminée, c'est une prochaine commande qui commence avec confiance.</blockquote><p>En choisissant l'option qui convient vraiment à votre situation, vous rendez l'achat local plus pratique et plus prévisible pour tout le monde.</p>`,
  },
];

async function main() {
  guardProduction();
  const prisma = getPrismaClient();

  for (const post of POSTS) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...post, status: "PUBLISHED" },
      create: { ...post, status: "PUBLISHED" },
    });
    console.log(`Seeded blog post: ${post.title}`);
  }
}

main()
  .catch((error) => {
    console.error("Unable to seed blog posts:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getPrismaClient().$disconnect();
  });
