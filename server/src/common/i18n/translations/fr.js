module.exports = {
  errors: {
    badRequest: "Requête invalide.",
    validation: "Échec de la validation.",
    unauthorized: "Authentification requise.",
    forbidden: "Vous n'avez pas la permission d'effectuer cette action.",
    notFound: "Ressource introuvable.",
    conflict: "Conflit avec des données existantes.",
    tooManyRequests: "Trop de requêtes. Veuillez ralentir.",
    internal: "Une erreur interne s'est produite.",
    ipBlocked:
      "Votre adresse IP a été temporairement bloquée suite à des tentatives répétées. Veuillez réessayer plus tard.",
    malformedJson: "JSON mal formé dans le corps de la requête.",
    upload: {
      fileTooLarge: "Fichier trop volumineux.",
      tooManyFiles: "Trop de fichiers téléversés.",
      unexpectedField: "Champ de fichier inattendu.",
      generic: "Échec du téléversement du fichier.",
    },
  },
  expenses: {
    titleRequired: "Le titre est requis.",
    invalidCategory: "Catégorie invalide.",
    invalidAmount: "Montant invalide.",
    currencyRequired: "La devise est requise.",
    beneficiaryNameRequired: "Le nom du bénéficiaire est requis.",
    invalidBeneficiaryPhone: "Numéro de téléphone du bénéficiaire invalide.",
    providerRequired: "Le fournisseur mobile money est requis.",
    invalidProvider: "Fournisseur mobile money invalide.",
    invalidCustomerMessage:
      "Le message client doit contenir 4 à 22 caractères alphanumériques.",
    invalidExpenseDate: "Date de dépense invalide.",
    invalidStatus: "Statut de dépense invalide.",
    invalidCategoryFilter: "Catégorie de dépense invalide.",
    notFound: "Dépense introuvable.",
    onlyPendingOrFailedApprovable:
      "Seules les dépenses en attente ou en échec peuvent être approuvées.",
    onlyPendingRejectable:
      "Seules les dépenses en attente peuvent être rejetées.",
    onlyPendingOrFailedEditable:
      "Seules les dépenses en attente ou en échec peuvent être modifiées.",
    rejectionReasonRequired: "Le motif de rejet est requis.",
    invalidProvider: "Fournisseur mobile money invalide.",
    alreadyProcessed: "Cette dépense a déjà été traitée ou rejetée.",
    cannotAttachPayout: "Impossible d'associer le payout à la dépense.",
    adminRequired: "Accès administrateur requis.",
    adminEmailMissing: "Votre compte administrateur n'a pas d'adresse e-mail.",
    noPendingApproval:
      "Aucune approbation en attente. Demandez un nouveau code.",
    invalidApprovalSession: "Session d'approbation invalide.",
    approvalMismatch: "La dépense ne correspond pas à la session.",
    approvalCodeExpired: "Code expiré. Demandez une nouvelle approbation.",
    approvalSessionExpiredRestart:
      "Session d'approbation expirée. Relancez l'approbation depuis le début.",
    invalidVerificationCode: "Code de vérification invalide.",
    sessionAndCodeRequired: "Identifiant de session et code requis.",
    otpSentMessage: "Un code de vérification a été envoyé à {{email}}.",
    otpEmailFailed:
      "Impossible d'envoyer l'e-mail de vérification. Vérifiez la configuration SMTP.",
    payoutRejected: "Le paiement PawaPay a été rejeté immédiatement.",
  },
  incidents: {
    titleRequired: "Veuillez indiquer un titre.",
    descriptionRequired: "Veuillez indiquer une description.",
    invalidSeverity: "Sévérité invalide.",
    notFound: "Incident introuvable.",
    invalidStatus: "Statut invalide.",
  },
};
