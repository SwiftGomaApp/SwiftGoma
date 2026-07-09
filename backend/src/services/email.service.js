const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const {
  email_from,
  email_port,
  email_user,
  email_pass,
} = require("../config/env.config");

const resolvedPort = parseInt(email_port || "587");

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: resolvedPort,
  secure: resolvedPort === 465,
  auth: {
    user: email_user,
    pass: email_pass,
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

const templatePath = path.join(__dirname, "../emails/templates/base.ejs");

// ─── Core send ────────────────────────────────────────────────────────────────
// attachments: [{ filename, content (Buffer), contentType }]

const sendEmail = async ({ to, subject, data, attachments = [] }) => {
  try {
    console.log(`📧 Sending email to ${to} — subject: "${subject}"`);
    const html = await ejs.renderFile(templatePath, data);
    console.log("📧 Template rendered");

    const mailOptions = {
      from: email_from || "SwiftGoma <noreply@swiftgoma.com>",
      to,
      subject,
      html,
    };

    if (attachments.length > 0) {
      mailOptions.attachments = attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType || "application/pdf",
      }));
    }

    const result = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", result.messageId);
    return result;
  } catch (err) {
    console.error("📧 Email failed:", err.message);
    throw err;
  }
};

// ─── OTP ─────────────────────────────────────────────────────────────────────

const sendOtpEmail = ({ to, name, code, context }) => {
  const contextMessages = {
    "verify-email":
      "Voici votre code de vérification pour confirmer votre adresse e-mail.",
    signin: "Voici votre code de connexion à votre compte SwiftGoma.",
    "reset-password": "Voici votre code pour réinitialiser votre mot de passe.",
    "change-email":
      "Voici votre code pour confirmer votre nouvelle adresse e-mail.",
    "2fa": "Voici votre code d'authentification à deux facteurs.",
    "unlink-google":
      "Voici votre code pour confirmer la dissociation de votre compte Google.",
    "remove-secondary-email":
      "Voici votre code pour confirmer la suppression de votre adresse e-mail secondaire.",
    "recover-account":
      "Voici votre code pour récupérer votre compte SwiftGoma.",
  };

  const whyMessages = {
    "verify-email":
      "Vous avez demandé la vérification de votre adresse e-mail lors de la création de votre compte SwiftGoma. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
    signin:
      "Vous avez demandé un code de connexion pour accéder à votre compte SwiftGoma. Si vous n'êtes pas à l'origine de cette demande, sécurisez immédiatement votre compte.",
    "reset-password":
      "Vous avez initié une réinitialisation de mot de passe sur SwiftGoma. Si vous n'avez pas fait cette demande, ignorez cet e-mail — votre mot de passe restera inchangé.",
    "change-email":
      "Vous avez demandé la modification de votre adresse e-mail sur SwiftGoma. Si ce n'est pas vous, contactez notre support.",
    "2fa":
      "Cet e-mail fait partie de votre processus de connexion sécurisée à deux facteurs. Ne partagez jamais ce code.",
    "unlink-google":
      "Vous avez demandé la dissociation de votre compte Google sur SwiftGoma. Si ce n'est pas vous, sécurisez immédiatement votre compte.",
    "remove-secondary-email":
      "Vous avez demandé la suppression de votre adresse e-mail secondaire sur SwiftGoma. Si ce n'est pas vous, contactez notre support.",
    "recover-account":
      "Vous avez demandé la récupération de votre compte SwiftGoma supprimé. Si ce n'est pas vous, ignorez cet e-mail.",
  };

  return sendEmail({
    to,
    subject: "Votre code de vérification SwiftGoma",
    data: {
      title: "Code de vérification",
      name,
      message: contextMessages[context] || contextMessages["verify-email"],
      whyText: whyMessages[context] || whyMessages["verify-email"],
      code,
      codeExpiresIn: `${process.env.OTP_EXPIRES_IN_MINUTES || 10} minutes`,
    },
  });
};

// ─── Invoice ──────────────────────────────────────────────────────────────────

const sendInvoiceEmail = ({ to, name, invoice, pdfBuffer }) => {
  const typeLabels = {
    SUBSCRIPTION: "Abonnement",
    ORDER: "Commande",
    WALLET_TOPUP: "Recharge de portefeuille",
  };

  const typeLabel = typeLabels[invoice.type] ?? "Transaction";
  const amount =
    invoice.currency === "USD"
      ? `$${Number(invoice.amount).toFixed(2)}`
      : `${Number(invoice.amount).toLocaleString("fr-FR")} CDF`;

  const attachments = pdfBuffer
    ? [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ]
    : [];

  return sendEmail({
    to,
    subject: `Facture ${invoice.invoiceNumber} — SwiftGoma`,
    attachments,
    data: {
      title: `Votre facture ${invoice.invoiceNumber}`,
      name,
      message: `Nous vous remercions pour votre paiement. Veuillez trouver ci-joint votre facture ${invoice.invoiceNumber} pour votre ${typeLabel.toLowerCase()} d'un montant de ${amount}.`,
      whyText:
        "Vous recevez cet e-mail car une transaction a été enregistrée sur votre compte SwiftGoma. Conservez cette facture pour vos dossiers.",
      linkUrl: invoice.pdfUrl ?? null,
      linkText: invoice.pdfUrl ? "Télécharger la facture en ligne" : null,
      details: [
        { label: "N° Facture", value: invoice.invoiceNumber },
        { label: "Type", value: typeLabel },
        { label: "Montant", value: amount },
        { label: "Devise", value: invoice.currency },
        { label: "Statut", value: "Payée" },
        {
          label: "Date d'émission",
          value: new Date(invoice.issuedAt ?? new Date()).toLocaleDateString(
            "fr-FR",
            {
              day: "2-digit",
              month: "long",
              year: "numeric",
            },
          ),
        },
      ],
      alert: null,
    },
  });
};

// ─── Payment failure ──────────────────────────────────────────────────────────

const sendPaymentFailedEmail = ({ to, name, planName, failureReason }) => {
  return sendEmail({
    to,
    subject: "Échec du paiement — Action requise",
    data: {
      title: "Paiement non abouti",
      name,
      message: `Votre paiement pour l'abonnement ${planName} n'a pas pu être traité${failureReason ? ` (${failureReason})` : ""}. Votre abonnement n'a pas été activé. Veuillez réessayer avec un autre numéro ou un autre opérateur Mobile Money.`,
      whyText:
        "Vous recevez cet e-mail car une tentative de paiement sur votre compte SwiftGoma a échoué.",
      linkUrl: `${process.env.CLIENT_URL}/settings/subscription`,
      linkText: "Réessayer le paiement",
      alert: {
        type: "danger",
        title: "Action requise",
        body: "Votre boutique ne sera pas activée tant que le paiement n'est pas confirmé. Réessayez dès que possible.",
      },
    },
  });
};

// ─── Welcome ──────────────────────────────────────────────────────────────────

const sendWelcomeEmail = ({ to, name, role }) => {
  const roleMessages = {
    BUYER:
      "Votre compte acheteur est prêt. Découvrez les boutiques locales de Goma et passez votre première commande.",
    SELLER:
      "Votre compte vendeur est activé. Créez votre boutique et commencez à vendre sur SwiftGoma.",
    DELIVERER:
      "Votre compte livreur est prêt. Commencez à accepter des livraisons dans votre zone.",
  };

  return sendEmail({
    to,
    subject: "Bienvenue sur SwiftGoma 🎉",
    data: {
      title: "Bienvenue sur SwiftGoma",
      name,
      message: roleMessages[role] || roleMessages.BUYER,
      whyText:
        "Vous recevez cet e-mail car vous venez de créer un compte SwiftGoma. Si vous n'êtes pas à l'origine de cette inscription, contactez notre support.",
      linkUrl: `${process.env.CLIENT_URL}/auth/sign-in`,
      linkText: "Accéder à mon compte",
    },
  });
};

// ─── Login alert ──────────────────────────────────────────────────────────────

const sendLoginAlertEmail = ({ to, name, loginActivity }) => {
  return sendEmail({
    to,
    subject: "Nouvelle connexion détectée sur votre compte",
    data: {
      title: "Alerte de connexion",
      name,
      message:
        "Une nouvelle connexion a été détectée sur votre compte SwiftGoma.",
      whyText:
        "Vous recevez cet e-mail car une connexion a été effectuée sur votre compte. Si vous ne reconnaissez pas cette activité, changez immédiatement votre mot de passe et activez l'authentification à deux facteurs.",
      loginActivity,
      alert: {
        type: "danger",
        title: "Ce n'était pas vous ?",
        body: "Si vous ne reconnaissez pas cette connexion, changez immédiatement votre mot de passe et activez l'authentification à deux facteurs.",
      },
    },
  });
};

// ─── Password reset ───────────────────────────────────────────────────────────

const sendPasswordResetEmail = ({ to, name, resetUrl }) => {
  return sendEmail({
    to,
    subject: "Réinitialisation de votre mot de passe SwiftGoma",
    data: {
      title: "Réinitialiser le mot de passe",
      name,
      message:
        "Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.",
      whyText:
        "Vous recevez cet e-mail car une demande de réinitialisation de mot de passe a été effectuée pour ce compte. Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.",
      linkUrl: resetUrl,
      linkText: "Réinitialiser le mot de passe",
      linkExpiresIn: "30 minutes",
      alert: {
        type: "danger",
        title: "Vous n'avez pas demandé ça ?",
        body: "Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail. Votre mot de passe restera inchangé.",
      },
    },
  });
};

// ─── Account deleted ──────────────────────────────────────────────────────────

const sendAccountDeletedEmail = ({ to, name }) => {
  return sendEmail({
    to,
    subject: "Votre compte SwiftGoma a été supprimé",
    data: {
      title: "Compte supprimé",
      name,
      message:
        "Votre compte SwiftGoma a bien été supprimé. Toutes vos données ont été anonymisées conformément à notre politique de confidentialité.",
      whyText:
        "Vous recevez cet e-mail car une demande de suppression de compte a été traitée. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement notre support.",
      alert: {
        type: "info",
        title: "Vous avez changé d'avis ?",
        body: "Vous disposez d'un délai de 30 jours pour récupérer votre compte en vous reconnectant avec vos identifiants.",
      },
    },
  });
};

// ─── Password changed ─────────────────────────────────────────────────────────

const sendPasswordChangedEmail = ({ to, name }) => {
  return sendEmail({
    to,
    subject: "Votre mot de passe a été modifié",
    data: {
      title: "Mot de passe modifié",
      name,
      message:
        "Le mot de passe de votre compte SwiftGoma a été modifié avec succès.",
      whyText:
        "Vous recevez cet e-mail car le mot de passe de votre compte vient d'être changé. Si vous n'êtes pas à l'origine de cette action, réinitialisez immédiatement votre mot de passe.",
      alert: {
        type: "danger",
        title: "Ce n'était pas vous ?",
        body: "Réinitialisez votre mot de passe immédiatement et contactez notre support si vous suspectez un accès non autorisé.",
      },
    },
  });
};

// ─── 2FA status ───────────────────────────────────────────────────────────────

const send2faStatusEmail = ({ to, name, enabled }) => {
  return sendEmail({
    to,
    subject: enabled
      ? "Authentification à deux facteurs activée"
      : "Authentification à deux facteurs désactivée",
    data: {
      title: enabled ? "2FA activée" : "2FA désactivée",
      name,
      message: enabled
        ? "L'authentification à deux facteurs a été activée sur votre compte. Votre compte est maintenant mieux protégé."
        : "L'authentification à deux facteurs a été désactivée sur votre compte.",
      whyText:
        "Vous recevez cet e-mail car les paramètres de sécurité de votre compte ont été modifiés. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement notre support.",
      alert: enabled
        ? null
        : {
            type: "danger",
            title: "Ce n'était pas vous ?",
            body: "Si vous n'avez pas désactivé la 2FA, sécurisez immédiatement votre compte en changeant votre mot de passe.",
          },
    },
  });
};

// ─── Session revoked ──────────────────────────────────────────────────────────

const sendSessionRevokedEmail = ({ to, name, count = 1 }) => {
  const isAll = count > 1;
  return sendEmail({
    to,
    subject: isAll
      ? "Toutes vos autres sessions ont été déconnectées"
      : "Une session a été déconnectée de votre compte",
    data: {
      title: isAll ? "Sessions révoquées" : "Session révoquée",
      name,
      message: isAll
        ? `${count} session${count > 1 ? "s" : ""} active${count > 1 ? "s" : ""} ont été déconnectées de votre compte SwiftGoma.`
        : "Une session active a été déconnectée de votre compte SwiftGoma.",
      whyText:
        "Vous recevez cet e-mail car une ou plusieurs sessions ont été révoquées depuis les paramètres de sécurité de votre compte. Si vous n'êtes pas à l'origine de cette action, changez immédiatement votre mot de passe.",
      alert: {
        type: "danger",
        title: "Ce n'était pas vous ?",
        body: "Si vous ne reconnaissez pas cette action, changez immédiatement votre mot de passe et activez l'authentification à deux facteurs.",
      },
    },
  });
};

// ─── Google link status ───────────────────────────────────────────────────────

const sendGoogleLinkStatusEmail = ({ to, name, linked }) => {
  return sendEmail({
    to,
    subject: linked
      ? "Compte Google associé à votre compte SwiftGoma"
      : "Compte Google dissocié de votre compte SwiftGoma",
    data: {
      title: linked ? "Google associé" : "Google dissocié",
      name,
      message: linked
        ? "Un compte Google a été associé à votre compte SwiftGoma. Vous pouvez maintenant vous connecter avec Google."
        : "Votre compte Google a été dissocié de votre compte SwiftGoma. Vous ne pouvez plus vous connecter via Google.",
      whyText:
        "Vous recevez cet e-mail car les méthodes de connexion de votre compte ont été modifiées. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement notre support.",
      alert: linked
        ? null
        : {
            type: "danger",
            title: "Ce n'était pas vous ?",
            body: "Si vous n'avez pas dissocié votre compte Google, sécurisez immédiatement votre compte en changeant votre mot de passe.",
          },
    },
  });
};

// ─── Passkey status ───────────────────────────────────────────────────────────

const sendPasskeyStatusEmail = ({ to, name, added, passkeyName }) => {
  return sendEmail({
    to,
    subject: added
      ? "Nouvelle clé d'accès ajoutée à votre compte"
      : "Clé d'accès supprimée de votre compte",
    data: {
      title: added ? "Clé d'accès ajoutée" : "Clé d'accès supprimée",
      name,
      message: added
        ? `Une nouvelle clé d'accès${passkeyName ? ` (${passkeyName})` : ""} a été enregistrée sur votre compte SwiftGoma.`
        : `Une clé d'accès${passkeyName ? ` (${passkeyName})` : ""} a été supprimée de votre compte SwiftGoma.`,
      whyText:
        "Vous recevez cet e-mail car les clés d'accès de votre compte ont été modifiées. Si vous n'êtes pas à l'origine de cette action, contactez immédiatement notre support.",
      alert: added
        ? null
        : {
            type: "danger",
            title: "Ce n'était pas vous ?",
            body: "Si vous n'avez pas supprimé cette clé d'accès, sécurisez immédiatement votre compte en changeant votre mot de passe.",
          },
    },
  });
};

// ─── Order confirmation ───────────────────────────────────────────────────────

const sendOrderConfirmationEmail = ({
  to,
  name,
  order,
  shopName,
  pdfBuffer,
}) => {
  const formatAmt = (amount, currency) =>
    currency === "USD"
      ? `$${Number(amount).toFixed(2)}`
      : `${Number(amount)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ".")} CDF`;

  const attachments = pdfBuffer
    ? [
        {
          filename: `${order.orderNumber}-confirmation.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ]
    : [];

  return sendEmail({
    to,
    subject: `Confirmation de commande ${order.orderNumber} — SwiftGoma`,
    attachments,
    data: {
      title: `Commande ${order.orderNumber} confirmée`,
      name,
      message: `Votre commande auprès de ${shopName} a été confirmée et est en cours de préparation. Veuillez trouver ci-joint votre confirmation de commande.`,
      whyText:
        "Vous recevez cet e-mail car vous venez de passer une commande sur SwiftGoma.",
      details: [
        { label: "N° Commande", value: order.orderNumber },
        { label: "Boutique", value: shopName },
        { label: "Total", value: formatAmt(order.total, order.currency) },
        { label: "Livraison", value: `${order.quartier}, ${order.commune}` },
        {
          label: "Paiement",
          value:
            order.paymentMethod === "MOBILE_MONEY"
              ? "Mobile Money"
              : "À la livraison",
        },
      ],
      linkUrl: `${process.env.CLIENT_URL}/orders/${order.id}`,
      linkText: "Suivre ma commande",
      alert: null,
    },
  });
};

const sendOrderConfirmedEmail = ({ to, name, order }) => {
  return sendEmail({
    to,
    subject: `Commande #${order.id} confirmée — SwiftGoma`,
    data: {
      title: "Commande confirmée",
      name,
      message:
        "Votre commande a bien été reçue et est en cours de traitement par le vendeur.",
      whyText:
        "Vous recevez cet e-mail car vous venez de passer une commande sur SwiftGoma. Conservez cet e-mail comme confirmation.",
      order,
    },
  });
};

// ─── Verify transporter ───────────────────────────────────────────────────────

const verifyEmailService = async () => {
  try {
    await transporter.verify();
    console.log("Email service connected (smtp.hostinger.com)");
    return true;
  } catch (err) {
    console.error("Email service unreachable:", err.message);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendOtpEmail,
  sendInvoiceEmail,
  sendPaymentFailedEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail,
  sendPasswordResetEmail,
  sendAccountDeletedEmail,
  sendPasswordChangedEmail,
  send2faStatusEmail,
  sendSessionRevokedEmail,
  sendGoogleLinkStatusEmail,
  sendPasskeyStatusEmail,
  sendOrderConfirmedEmail,
  sendOrderConfirmationEmail,
  verifyEmailService,
};
