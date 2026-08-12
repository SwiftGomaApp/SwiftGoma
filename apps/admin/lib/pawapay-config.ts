import {
  DRC_DIAL_CODE,
  DRC_PAWAPAY_COUNTRY,
  DRC_CURRENCIES,
  filterDrcCurrencies,
} from "./drc-payments";

export interface PawaPayOperationType {
  status?: string;
  decimalsInAmount?: number | string;
  minAmount?: string;
  maxAmount?: string;
}

export interface PawaPayCurrency {
  currency: string;
  operationTypes?: Record<string, PawaPayOperationType>;
}

export interface PawaPayProvider {
  provider: string;
  currencies?: PawaPayCurrency[];
}

export interface PawaPayCountry {
  country: string;
  providers?: PawaPayProvider[];
}

export interface PawaPayActiveConfig {
  countries?: PawaPayCountry[];
}

export interface PayoutProviderOption {
  provider: string;
  currencies: string[];
}

export interface PayoutCountryOption {
  country: string;
  dialCode: string;
  providers: PayoutProviderOption[];
}

export { DRC_PAWAPAY_COUNTRY, DRC_DIAL_CODE, DRC_CURRENCIES };

function isOperationActive(op?: PawaPayOperationType): boolean {
  if (!op) return false;
  const status = (op.status ?? "").toLowerCase();
  return (
    status.includes("active") ||
    status === "operational" ||
    status === "enabled"
  );
}

/** Admin deposit/payout matrix — DRC (COD) only, CDF + USD. */
function parseOperationOptions(
  config: PawaPayActiveConfig,
  operation: "DEPOSIT" | "PAYOUT",
): PayoutCountryOption[] {
  return (config.countries ?? [])
    .filter((country) => country.country === DRC_PAWAPAY_COUNTRY)
    .map((country) => {
      const providers = (country.providers ?? [])
        .map((provider) => {
          const currencies = filterDrcCurrencies(
            (provider.currencies ?? [])
              .filter((cur) => isOperationActive(cur.operationTypes?.[operation]))
              .map((cur) => cur.currency),
          );

          if (currencies.length === 0) return null;

          return {
            provider: provider.provider,
            currencies,
          };
        })
        .filter((p): p is PayoutProviderOption => p !== null);

      if (providers.length === 0) return null;

      return {
        country: country.country,
        dialCode: DRC_DIAL_CODE,
        providers,
      };
    })
    .filter((c): c is PayoutCountryOption => c !== null);
}

export function parsePayoutOptions(
  config: PawaPayActiveConfig,
): PayoutCountryOption[] {
  return parseOperationOptions(config, "PAYOUT");
}

export function parseDepositOptions(
  config: PawaPayActiveConfig,
): PayoutCountryOption[] {
  return parseOperationOptions(config, "DEPOSIT");
}

export function getProvidersForCountry(
  options: PayoutCountryOption[],
  country: string,
): PayoutProviderOption[] {
  return options.find((c) => c.country === country)?.providers ?? [];
}

export function getCurrenciesForProvider(
  providers: PayoutProviderOption[],
  provider: string,
): string[] {
  return filterDrcCurrencies(
    providers.find((p) => p.provider === provider)?.currencies ?? [],
  );
}

export function buildMsisdn(dialCode: string, localPhone: string): string {
  const local = localPhone.replace(/\D/g, "");
  const code = dialCode.replace(/\D/g, "");
  return `${code}${local}`;
}

export function getDefaultPayoutSelection(options: PayoutCountryOption[]) {
  const country = options[0];
  const provider = country?.providers[0];
  const currency = provider?.currencies[0] ?? "";

  return {
    country: country?.country ?? DRC_PAWAPAY_COUNTRY,
    dialCode: country?.dialCode ?? DRC_DIAL_CODE,
    provider: provider?.provider ?? "",
    currency,
    localPhone: "",
  };
}
