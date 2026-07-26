import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Fichiers générés par shadcn — pas maintenus à la main, ne pas linter
    // avec les mêmes règles strictes que le reste du code.
    "components/ui/**",
    "hooks/use-mobile.ts",
  ]),
]);

export default eslintConfig;
