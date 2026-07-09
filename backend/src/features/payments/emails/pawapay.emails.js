const { sendEmail } = require("../../../services/email.service");

const formatAmount = (amount, currency) =>
  currency === "USD"
    ? `$${Number(amount).toFixed(2)}`
    : `${Number(amount).toLocaleString("fr-FR")} ${currency}`;

const sendDepositSuccessEmail = ({
  to,
  name,
  amount,
  currency,
  depositId,
  reason,
}) =>
  sendEmail({
    to,
    subject: "Paiement reçu avec succès — SwiftGoma",
    data: {
      title: "Paiement confirmé",
      name,
      message: `Votre paiement Mobile Money de ${formatAmount(amount, currency)}${reason ? ` pour "${reason}"` : ""} a été reçu avec succès.`,
      whyText:
        "Vous recevez cet e-mail car un paiement a été confirmé sur votre compte SwiftGoma.",
      details: [
        { label: "Montant", value: formatAmount(amount, currency) },
        { label: "Référence", value: depositId },
        { label: "Statut", value: "Payé" },
      ],
      alert: null,
    },
  });

const sendDepositFailedEmail = ({
  to,
  name,
  amount,
  currency,
  depositId,
  failureReason,
}) =>
  sendEmail({
    to,
    subject: "Échec du paiement Mobile Money — SwiftGoma",
    data: {
      title: "Paiement échoué",
      name,
      message: `Votre paiement Mobile Money de ${formatAmount(amount, currency)} n'a pas abouti${failureReason ? ` (${failureReason})` : ""}. Veuillez réessayer avec un autre numéro ou opérateur.`,
      whyText:
        "Vous recevez cet e-mail car une tentative de paiement sur votre compte SwiftGoma a échoué.",
      details: [
        { label: "Montant", value: formatAmount(amount, currency) },
        { label: "Référence", value: depositId },
      ],
      alert: {
        type: "danger",
        title: "Action requise",
        body: "Réessayez le paiement pour finaliser votre commande ou abonnement.",
      },
    },
  });

// ─── Payout (you paid a customer / seller / deliverer) ─────────────────────

const sendPayoutSuccessEmail = ({ to, name, amount, currency, payoutId }) =>
  sendEmail({
    to,
    subject: "Paiement envoyé avec succès — SwiftGoma",
    data: {
      title: "Paiement effectué",
      name,
      message: `Un paiement de ${formatAmount(amount, currency)} a été envoyé avec succès sur votre compte Mobile Money.`,
      whyText:
        "Vous recevez cet e-mail car un paiement (retrait/versement) a été traité sur votre compte SwiftGoma.",
      details: [
        { label: "Montant", value: formatAmount(amount, currency) },
        { label: "Référence", value: payoutId },
        { label: "Statut", value: "Envoyé" },
      ],
      alert: null,
    },
  });

const sendPayoutFailedEmail = ({
  to,
  name,
  amount,
  currency,
  payoutId,
  failureReason,
}) =>
  sendEmail({
    to,
    subject: "Échec de l'envoi d'un paiement — SwiftGoma",
    data: {
      title: "Paiement non abouti",
      name,
      message: `Le paiement de ${formatAmount(amount, currency)} vers votre compte Mobile Money n'a pas pu être traité${failureReason ? ` (${failureReason})` : ""}.`,
      whyText:
        "Vous recevez cet e-mail car un versement destiné à votre compte a échoué.",
      details: [
        { label: "Montant", value: formatAmount(amount, currency) },
        { label: "Référence", value: payoutId },
      ],
      alert: {
        type: "danger",
        title: "Que faire ?",
        body: "Vérifiez que votre numéro Mobile Money est actif. Notre équipe a été notifiée et retentera l'envoi.",
      },
    },
  });

// ─── Refund ─────────────────────────────────────────────────────────────────

const sendRefundSuccessEmail = ({ to, name, amount, currency, refundId }) =>
  sendEmail({
    to,
    subject: "Remboursement effectué — SwiftGoma",
    data: {
      title: "Remboursement confirmé",
      name,
      message: `Votre remboursement de ${formatAmount(amount, currency)} a été traité avec succès et envoyé sur votre compte Mobile Money.`,
      whyText:
        "Vous recevez cet e-mail car un remboursement a été effectué sur votre compte SwiftGoma.",
      details: [
        { label: "Montant remboursé", value: formatAmount(amount, currency) },
        { label: "Référence", value: refundId },
        { label: "Statut", value: "Remboursé" },
      ],
      alert: null,
    },
  });

const sendRefundFailedEmail = ({
  to,
  name,
  amount,
  currency,
  refundId,
  failureReason,
}) =>
  sendEmail({
    to,
    subject: "Échec du remboursement — SwiftGoma",
    data: {
      title: "Remboursement non abouti",
      name,
      message: `Votre remboursement de ${formatAmount(amount, currency)} n'a pas pu être traité${failureReason ? ` (${failureReason})` : ""}. Notre équipe support va vous contacter.`,
      whyText:
        "Vous recevez cet e-mail car une tentative de remboursement sur votre compte a échoué.",
      details: [
        { label: "Montant", value: formatAmount(amount, currency) },
        { label: "Référence", value: refundId },
      ],
      alert: {
        type: "danger",
        title: "Besoin d'aide ?",
        body: "Contactez notre support si vous ne recevez pas votre remboursement sous 48h.",
      },
    },
  });

module.exports = {
  sendDepositSuccessEmail,
  sendDepositFailedEmail,
  sendPayoutSuccessEmail,
  sendPayoutFailedEmail,
  sendRefundSuccessEmail,
  sendRefundFailedEmail,
};
