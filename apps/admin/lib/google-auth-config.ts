/** Google Identity Services — browser OAuth client ID (public). */
export function getGoogleClientId(): string | undefined {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  return clientId || undefined;
}

export const GOOGLE_AUTH_UNAVAILABLE_MESSAGE =
  "La connexion Google n'est pas configurée pour cette application admin. Définissez NEXT_PUBLIC_GOOGLE_CLIENT_ID dans apps/admin/.env.local (même valeur que l'application web).";
