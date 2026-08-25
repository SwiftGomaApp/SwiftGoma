"use client";
import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

// next-themes renders its own anti-flash-of-wrong-theme <script> tag as part
// of the React tree (see its `ThemeScript` internal component) so the theme
// class is applied before hydration. React 19 added a dev-only console.error
// for any <script> encountered while rendering, which fires synchronously
// during the very first render/hydration pass — before any component's
// useEffect can run. The patch must therefore be installed at module scope
// (import time), not inside an effect, or it misses that first occurrence.
// This is a known upstream interaction between next-themes' script technique
// and React 19: https://github.com/pacocoursey/next-themes/issues/343
const SCRIPT_TAG_WARNING =
  "Encountered a script tag while rendering React component";

if (typeof console !== "undefined" && !(console.error as any).__swgPatched) {
  const originalError = console.error;
  const patched = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes(SCRIPT_TAG_WARNING)) {
      return;
    }
    originalError(...args);
  };
  (patched as any).__swgPatched = true;
  console.error = patched;
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
