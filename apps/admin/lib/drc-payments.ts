/** SwiftGoma admin — DRC-only payment scope (PawaPay + MbiyoPay). */

export const DRC_PAWAPAY_COUNTRY = "COD";
export const DRC_MBiyopAY_COUNTRY_CODE = "CD";
export const DRC_DIAL_CODE = "243";
export const DRC_CURRENCIES = ["CDF", "USD"] as const;

export type DrcCurrency = (typeof DRC_CURRENCIES)[number];

const DRC_CURRENCY_SET = new Set<string>(DRC_CURRENCIES);

export function isDrcCurrency(value: string): value is DrcCurrency {
  return DRC_CURRENCY_SET.has(value.toUpperCase());
}

export function filterDrcCurrencies(currencies: string[]): string[] {
  return currencies.filter((c) => isDrcCurrency(c));
}

export function filterWalletBalances(items: unknown): unknown {
  if (Array.isArray(items)) {
    return items.filter((row) => {
      if (!row || typeof row !== "object") return false;
      if ("currency" in row) {
        return isDrcCurrency(String((row as { currency: string }).currency));
      }
      return true;
    });
  }

  if (items && typeof items === "object") {
    return Object.fromEntries(
      Object.entries(items as Record<string, unknown>).filter(([key]) =>
        isDrcCurrency(key),
      ),
    );
  }

  return items;
}

export function filterPawaPayWalletBalances<T extends { currency: string }>(
  balances: T[],
): T[] {
  return balances.filter((b) => isDrcCurrency(b.currency));
}

export interface BalanceDisplayItem {
  id: string;
  currency: DrcCurrency | null;
  label: string;
  amount: number | string;
  subtitle?: string;
}

function formatNetworkLabel(network?: string): string | undefined {
  if (!network) return undefined;
  return network.charAt(0).toUpperCase() + network.slice(1);
}

function extractAmount(row: Record<string, unknown>): number | string | null {
  for (const key of ["amount", "balance", "value", "available"]) {
    if (key in row && row[key] !== undefined && row[key] !== null) {
      return row[key] as number | string;
    }
  }
  return null;
}

export function normalizeBalanceItems(items: unknown): BalanceDisplayItem[] {
  if (!items) return [];

  if (Array.isArray(items)) {
    const result: BalanceDisplayItem[] = [];

    items.forEach((row, index) => {
      if (!row || typeof row !== "object") return;
      const record = row as Record<string, unknown>;
      const amount = extractAmount(record);
      if (amount === null) return;

      const currencyRaw =
        "currency" in record ? String(record.currency).toUpperCase() : null;
      const currency =
        currencyRaw && isDrcCurrency(currencyRaw) ? currencyRaw : null;
      const network =
        "network" in record ? String(record.network) : undefined;

      const label = currency ?? formatNetworkLabel(network) ?? `Balance ${index + 1}`;

      result.push({
        id: `${label}-${index}`,
        currency,
        label,
        amount,
        ...(network && currency
          ? { subtitle: formatNetworkLabel(network) }
          : {}),
      });
    });

    return result;
  }

  if (typeof items === "object") {
    return Object.entries(items as Record<string, unknown>)
      .map(([key, value]) => {
        const amount =
          typeof value === "object" && value !== null
            ? extractAmount(value as Record<string, unknown>)
            : value;
        if (amount === null || amount === undefined) return null;

        const currencyKey = key.toUpperCase();
        const currency = isDrcCurrency(currencyKey) ? currencyKey : null;

        return {
          id: key,
          currency,
          label: currency ?? key,
          amount: amount as number | string,
        };
      })
      .filter((item): item is BalanceDisplayItem => item !== null);
  }

  return [];
}

export function sortBalanceItems(items: BalanceDisplayItem[]): BalanceDisplayItem[] {
  const order = { CDF: 0, USD: 1 } as const;
  return [...items].sort((a, b) => {
    const aOrder = a.currency ? (order[a.currency] ?? 99) : 99;
    const bOrder = b.currency ? (order[b.currency] ?? 99) : 99;
    return aOrder - bOrder || a.label.localeCompare(b.label);
  });
}

export interface FormattedBalance {
  prefix: string;
  amount: string;
  suffix: string;
  compact: string;
}

export function parseBalanceAmount(amount: number | string): number | null {
  if (typeof amount === "number") {
    return Number.isFinite(amount) ? amount : null;
  }

  const cleaned = String(amount).trim().replace(/[\s,'"]/g, "");
  if (!cleaned) return null;

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function joinIntegerParts(
  parts: Intl.NumberFormatPart[],
): { prefix: string; amount: string; suffix: string } {
  let prefix = "";
  let amount = "";
  let suffix = "";
  let pastInteger = false;

  for (const part of parts) {
    if (part.type === "currency") {
      prefix = part.value;
      continue;
    }

    if (part.type === "integer" || part.type === "group") {
      if (!pastInteger) amount += part.value;
      continue;
    }

    if (part.type === "decimal" || part.type === "fraction") {
      pastInteger = true;
      suffix += part.value;
      continue;
    }

    if (part.type === "literal" && pastInteger) {
      suffix += part.value;
    }
  }

  return { prefix, amount, suffix };
}

function formatGroupedInteger(num: number): string {
  const rounded = Math.round(num);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
}

export function formatBalanceDisplay(
  amount: number | string,
  currency: DrcCurrency | null,
): FormattedBalance {
  const num = parseBalanceAmount(amount);
  if (num === null) {
    const raw = String(amount);
    return { prefix: "", amount: raw, suffix: "", compact: raw };
  }

  if (currency === "CDF") {
    const grouped = formatGroupedInteger(num);

    return {
      prefix: "",
      amount: grouped,
      suffix: " FC",
      compact: `${grouped} FC`,
    };
  }

  if (currency === "USD") {
    const parts = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).formatToParts(num);

    const { prefix, amount: dollars, suffix } = joinIntegerParts(parts);

    return {
      prefix,
      amount: dollars,
      suffix,
      compact: `${prefix}${dollars}${suffix}`,
    };
  }

  const grouped = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);

  return {
    prefix: "",
    amount: grouped,
    suffix: "",
    compact: grouped,
  };
}

export function formatDrcBalance(
  amount: number | string,
  currency: DrcCurrency | null,
): string {
  return formatBalanceDisplay(amount, currency).compact;
}
