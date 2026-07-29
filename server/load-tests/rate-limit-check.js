// Pas un test de charge — un test de comportement. Envoie 15 requêtes de
// login rapides et vérifie qu'à partir de la 11e, on reçoit du 429.
const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

async function attemptLogin(i) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Un vrai User-Agent, sinon botDetection bloque tout de suite
      // avant même d'atteindre le rate limiter — fausserait le test.
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
    body: JSON.stringify({
      email: "loadtest-does-not-exist@swiftgoma.com",
      password: "wrong-password-on-purpose",
    }),
  });
  return { attempt: i, status: res.status };
}

async function run() {
  console.log("Envoi de 15 tentatives de login en rafale...\n");

  for (let i = 1; i <= 15; i++) {
    const { attempt, status } = await attemptLogin(i);
    const flag = status === 429 ? "  <-- bloqué par le rate limiter" : "";
    console.log(`Tentative ${attempt}: HTTP ${status}${flag}`);
  }

  console.log(
    "\nAttendu: HTTP 401 (mauvais identifiants) pour les ~10 premières, " +
      "puis HTTP 429 à partir de la 11e.",
  );
}

run().catch((err) => {
  console.error("Rate limit check failed:", err);
  process.exit(1);
});
