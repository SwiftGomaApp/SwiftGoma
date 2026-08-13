#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const ROOTS = [
  path.join(__dirname, "../src"),
  path.join(__dirname, "../server.js"),
];

const TRANSLATIONS = [
  ['Authentication required.', 'Authentification requise.'],
  ['Access denied.', 'Accès refusé.'],
  [
    'You do not have permission to access this resource.',
    "Vous n'avez pas la permission d'accéder à cette ressource.",
  ],
  ['Route not found:', 'Route introuvable :'],
  ['Missing Google ID token.', 'Jeton Google ID manquant.'],
  ['Invalid Google sign-in response.', 'Réponse de connexion Google invalide.'],
  ['No image file provided.', 'Aucun fichier image fourni.'],
  ['No account found with this email.', 'Aucun compte trouvé avec cet e-mail.'],
  ['Invalid deposit amount.', 'Montant de dépôt invalide.'],
  ['Invalid payer phone number.', 'Numéro de téléphone du payeur invalide.'],
  [
    'Missing provider (mobile money operator).',
    'Fournisseur mobile money manquant.',
  ],
  ['Invalid payout amount.', 'Montant de paiement sortant invalide.'],
  ['Invalid recipient phone number.', 'Numéro de téléphone du destinataire invalide.'],
  ['Missing depositId to refund.', "Identifiant de dépôt manquant pour le remboursement."],
  ['Invalid refund amount.', 'Montant de remboursement invalide.'],
  ['Failed to initiate refund.', "Impossible d'initier le remboursement."],
  ['Failed to initiate deposit.', "Impossible d'initier le dépôt."],
  ['Failed to initiate payout.', "Impossible d'initier le paiement sortant."],
  ['Invalid amount.', 'Montant invalide.'],
  ['Metadata cannot exceed 10 items.', 'Les métadonnées ne peuvent pas dépasser 10 éléments.'],
  [
    'createRateLimiter: `name` is required (used to namespace this limiter\'s Redis keys).',
    'createRateLimiter : `name` est requis (utilisé pour namespacer les clés Redis de ce limiteur).',
  ],
  ['Prefer authenticated user id; fall back to IP', ''],
  ['Too many requests', 'Trop de requêtes'],
  ['Please slow down', 'Veuillez ralentir'],
  ['Please wait', 'Veuillez patienter'],
  ['Invalid verification code.', 'Code de vérification invalide.'],
  ['Admin access required.', 'Accès administrateur requis.'],
  [
    'Your admin account has no email address — payout approval requires one.',
    "Votre compte administrateur n'a pas d'adresse e-mail — l'approbation de paiement en nécessite une.",
  ],
  ['Pending ID and verification code are required.', 'Identifiant de session et code de vérification requis.'],
  [
    'No pending payout approval found. Request a new code.',
    'Aucune approbation de paiement en attente. Demandez un nouveau code.',
  ],
  ['Invalid payout approval session.', "Session d'approbation de paiement invalide."],
  ['Payout provider mismatch.', 'Fournisseur de paiement incompatible.'],
  ['Payout approval type mismatch.', "Type d'approbation de paiement incompatible."],
  [
    'Verification code expired. Request a new payout approval.',
    'Code de vérification expiré. Demandez une nouvelle approbation de paiement.',
  ],
  [
    'Failed to send payout verification email. Check SMTP configuration.',
    "Impossible d'envoyer l'e-mail de vérification de paiement. Vérifiez la configuration SMTP.",
  ],
  [
    'A verification code was sent to',
    'Un code de vérification a été envoyé à',
  ],
  ['Enter it to approve this payout.', 'Saisissez-le pour approuver ce paiement.'],
  ['Currency, country, and provider are required.', 'Devise, pays et fournisseur sont requis.'],
  [
    'customerMessage must be 4-22 alphanumeric characters.',
    'Le message client doit contenir entre 4 et 22 caractères alphanumériques.',
  ],
  ['depositId is required for a refund.', "L'identifiant de dépôt est requis pour un remboursement."],
  [
    'Direct refunds are disabled.',
    'Les remboursements directs sont désactivés.',
  ],
  ['Too many webhook requests.', 'Trop de requêtes webhook.'],
  [
    'Too many payment requests. Please wait before trying again.',
    'Trop de requêtes de paiement. Veuillez patienter avant de réessayer.',
  ],
  [
    'Too many attempts. Please wait a few minutes before trying again.',
    'Trop de tentatives. Veuillez patienter quelques minutes avant de réessayer.',
  ],
  [
    'Too many requests. Please slow down and try again shortly.',
    'Trop de requêtes. Veuillez ralentir et réessayer dans un instant.',
  ],
  [
    '[app] CLIENT_ORIGINS must be set in production — refusing to start with an open CORS policy.',
    "[app] CLIENT_ORIGINS doit être défini en production — refus de démarrer avec une politique CORS ouverte.",
  ],
  ['Refund initiation failed', 'Échec du remboursement'],
];

function stripComments(source) {
  let result = "";
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let inLineComment = false;
  let inBlockComment = false;
  let escaped = false;

  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") {
        inLineComment = false;
        result += ch;
      }
      i += 1;
      continue;
    }

    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "/" && next === "/") {
        inLineComment = true;
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        inBlockComment = true;
        i += 2;
        continue;
      }
    }

    if (!inDouble && !inTemplate && ch === "'" && !escaped) {
      inSingle = !inSingle;
      result += ch;
      escaped = ch === "\\" && !escaped;
      i += 1;
      continue;
    }

    if (!inSingle && !inTemplate && ch === '"' && !escaped) {
      inDouble = !inDouble;
      result += ch;
      escaped = ch === "\\" && !escaped;
      i += 1;
      continue;
    }

    if (!inSingle && !inDouble && ch === "`" && !escaped) {
      inTemplate = !inTemplate;
      result += ch;
      escaped = ch === "\\" && !escaped;
      i += 1;
      continue;
    }

    escaped = (ch === "\\" && !escaped) && (inSingle || inDouble || inTemplate);
    result += ch;
    i += 1;
  }

  return result
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

function applyTranslations(source) {
  let out = source;
  for (const [from, to] of TRANSLATIONS) {
    if (!to) continue;
    out = out.split(from).join(to);
  }
  return out;
}

function collectFiles(entry) {
  if (!fs.existsSync(entry)) return [];
  const stat = fs.statSync(entry);
  if (stat.isFile() && entry.endsWith(".js")) return [entry];
  if (!stat.isDirectory()) return [];
  const files = [];
  for (const name of fs.readdirSync(entry)) {
    if (name === "node_modules") continue;
    files.push(...collectFiles(path.join(entry, name)));
  }
  return files;
}

let processed = 0;
for (const root of ROOTS) {
  for (const file of collectFiles(root)) {
    const original = fs.readFileSync(file, "utf8");
    let updated = stripComments(original);
    updated = applyTranslations(updated);
    if (updated !== original) {
      fs.writeFileSync(file, updated);
      processed += 1;
    }
  }
}

console.log(`Processed ${processed} file(s).`);
