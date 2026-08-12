export type MapPinVariant = "destination" | "rider";

const PIN_CONFIG: Record<
  MapPinVariant,
  { label: string; pulse?: boolean; shellVar: "--primary" | "--foreground" }
> = {
  destination: {
    label: "Livraison",
    shellVar: "--primary",
  },
  rider: {
    label: "Livreur",
    pulse: true,
    shellVar: "--foreground",
  },
};

function readThemeColor(variable: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();
  return value || fallback;
}

function applyLabelStyles(el: HTMLElement) {
  el.style.marginTop = "6px";
  el.style.whiteSpace = "nowrap";
  el.style.borderRadius = "9999px";
  el.style.padding = "3px 10px";
  el.style.fontSize = "10px";
  el.style.fontWeight = "600";
  el.style.lineHeight = "1.2";
  el.style.backgroundColor = readThemeColor("--card", "#ffffff");
  el.style.color = readThemeColor("--foreground", "#1a1a1a");
  el.style.border = `1px solid ${readThemeColor("--border", "#e5e5e5")}`;
  el.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
}

function applyPinShellStyles(
  el: HTMLElement,
  shellVar: "--primary" | "--foreground",
) {
  const isPrimary = shellVar === "--primary";
  el.style.position = "relative";
  el.style.display = "flex";
  el.style.height = "44px";
  el.style.width = "44px";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  el.style.borderRadius = "9999px";
  el.style.border = `2px solid ${readThemeColor("--background", "#ffffff")}`;
  el.style.backgroundColor = readThemeColor(
    shellVar,
    isPrimary ? "#ea580c" : "#1a1a1a",
  );
  el.style.boxShadow = "0 8px 20px rgba(0, 0, 0, 0.2)";
  el.style.color = readThemeColor(
    isPrimary ? "--primary-foreground" : "--background",
    isPrimary ? "#ffffff" : "#ffffff",
  );
}

export function createMapPinElement(variant: MapPinVariant): HTMLDivElement {
  const config = PIN_CONFIG[variant];
  const root = document.createElement("div");
  root.style.position = "relative";
  root.style.display = "flex";
  root.style.flexDirection = "column";
  root.style.alignItems = "center";
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", config.label);

  if (config.pulse) {
    const pulse = document.createElement("div");
    pulse.style.position = "absolute";
    pulse.style.inset = "-8px";
    pulse.style.borderRadius = "9999px";
    pulse.style.backgroundColor = readThemeColor("--foreground", "#1a1a1a");
    pulse.style.opacity = "0.15";
    root.appendChild(pulse);
  }

  const pin = document.createElement("div");
  applyPinShellStyles(pin, config.shellVar);
  pin.innerHTML =
    variant === "destination"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>`;

  const tag = document.createElement("div");
  tag.textContent = config.label;
  applyLabelStyles(tag);

  root.appendChild(pin);
  root.appendChild(tag);

  return root;
}
