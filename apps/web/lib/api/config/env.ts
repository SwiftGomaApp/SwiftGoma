function required(name: string, value: string | undefined): string {
  if (!value && process.env.NODE_ENV === "production") {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }
  return value ?? "";
}

export const env = {
  client: {
    apiBaseUrl: required(
      "NEXT_PUBLIC_API_BASE_URL",
      process.env.NEXT_PUBLIC_API_BASE_URL,
    ),
  },
  server: {
    apiBaseUrl: required(
      "API_BASE_URL",
      process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL,
    ),
  },
};
