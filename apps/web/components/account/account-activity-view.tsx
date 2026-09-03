"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Fingerprint,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ProductPagination } from "@/components/products/product-pagination";
import {
  listAccountActivity,
  type AccountActivityAction,
  type AccountActivityEntry,
  type AccountActivityListResult,
} from "@/lib/api/routes/auth.routes";
import type { Locale } from "@/lib/language";
import SecureAccountAction from "./secure-account-action";

const PAGE_SIZE = 20;

const STRINGS = {
  en: {
    breadcrumb: "Security",
    title: "Recent activity",
    description: "A history of security-relevant events on your account.",
    resultsOne: "event",
    resultsMany: "events",
    empty: "No activity yet",
    emptyDescription: "Security events on your account will show up here.",
    you: "You",
    labels: {
      LOGIN_SUCCESS: "Signed in",
      LOGIN_FAILED: "Failed sign-in attempt",
      PASSWORD_CREATED: "Password created",
      PASSWORD_CHANGED: "Password changed",
      PASSWORD_RESET: "Password reset",
      TWO_FACTOR_ENABLED: "Two-factor authentication enabled",
      TWO_FACTOR_DISABLED: "Two-factor authentication disabled",
      BACKUP_CODES_REGENERATED: "Backup codes regenerated",
      PASSKEY_ADDED: "Passkey added",
      PASSKEY_REMOVED: "Passkey removed",
      SESSION_REVOKED: "Signed out of a device",
      ALL_SESSIONS_REVOKED: "Signed out of all devices",
      ACCOUNT_SECURED: "Account secured",
    },
  },
  fr: {
    breadcrumb: "Sécurité",
    title: "Activité récente",
    description:
      "L'historique des événements liés à la sécurité de votre compte.",
    resultsOne: "événement",
    resultsMany: "événements",
    empty: "Aucune activité pour le moment",
    emptyDescription:
      "Les événements de sécurité de votre compte apparaîtront ici.",
    you: "Vous",
    labels: {
      LOGIN_SUCCESS: "Connexion",
      LOGIN_FAILED: "Tentative de connexion échouée",
      PASSWORD_CREATED: "Mot de passe créé",
      PASSWORD_CHANGED: "Mot de passe modifié",
      PASSWORD_RESET: "Mot de passe réinitialisé",
      TWO_FACTOR_ENABLED: "Authentification à deux facteurs activée",
      TWO_FACTOR_DISABLED: "Authentification à deux facteurs désactivée",
      BACKUP_CODES_REGENERATED: "Codes de secours régénérés",
      PASSKEY_ADDED: "Clé d'accès ajoutée",
      PASSKEY_REMOVED: "Clé d'accès supprimée",
      SESSION_REVOKED: "Déconnexion d'un appareil",
      ALL_SESSIONS_REVOKED: "Déconnexion de tous les appareils",
      ACCOUNT_SECURED: "Compte sécurisé",
    },
  },
} as const;

const ACTION_ICONS: Record<AccountActivityAction, LucideIcon> = {
  LOGIN_SUCCESS: LogIn,
  LOGIN_FAILED: ShieldAlert,
  PASSWORD_CREATED: KeyRound,
  PASSWORD_CHANGED: KeyRound,
  PASSWORD_RESET: KeyRound,
  TWO_FACTOR_ENABLED: ShieldCheck,
  TWO_FACTOR_DISABLED: ShieldOff,
  BACKUP_CODES_REGENERATED: RefreshCw,
  PASSKEY_ADDED: Fingerprint,
  PASSKEY_REMOVED: Fingerprint,
  SESSION_REVOKED: LogOut,
  ALL_SESSIONS_REVOKED: LogOut,
  ACCOUNT_SECURED: ShieldCheck,
};

const SENSITIVE_ACTIONS: ReadonlySet<AccountActivityAction> = new Set([
  "LOGIN_FAILED",
  "PASSWORD_CHANGED",
  "PASSWORD_RESET",
  "TWO_FACTOR_DISABLED",
  "ALL_SESSIONS_REVOKED",
]);

function formatDate(value: string, locale: Locale): string {
  return new Date(value).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getDetail(entry: AccountActivityEntry): string | null {
  const metadata = entry.metadata;
  if (!metadata) return null;

  if (typeof metadata.ip === "string" && metadata.ip) {
    return metadata.ip;
  }
  if (typeof metadata.deviceName === "string" && metadata.deviceName) {
    return metadata.deviceName;
  }
  if (typeof metadata.revokedCount === "number") {
    return `${metadata.revokedCount}`;
  }
  return null;
}

export function AccountActivityView({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const searchParams = useSearchParams();
  const currentPage = Math.max(1, Number(searchParams.get("page")) || 1);

  const [result, setResult] = useState<AccountActivityListResult | null>(null);

  useEffect(() => {
    setResult(null);
    listAccountActivity({ page: currentPage, limit: PAGE_SIZE })
      .then(setResult)
      .catch(() =>
        setResult({
          activity: [],
          pagination: { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 },
        }),
      );
  }, [currentPage]);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/account/security" />}>
              {t.breadcrumb}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.description}</p>
        {result && result.pagination.total > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            {result.pagination.total}{" "}
            {result.pagination.total === 1 ? t.resultsOne : t.resultsMany}
          </p>
        )}
      </div>

      {result === null ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : result.activity.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Shield />
            </EmptyMedia>
            <EmptyTitle>{t.empty}</EmptyTitle>
            <EmptyDescription>{t.emptyDescription}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {result.activity.map((entry) => {
              const Icon = ACTION_ICONS[entry.action] ?? Shield;
              const isSensitive = SENSITIVE_ACTIONS.has(entry.action);
              const detail = getDetail(entry);

              return (
                <li key={entry.id}>
                  <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                    <div
                      className={
                        isSensitive
                          ? "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
                          : "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      }
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {t.labels[entry.action] ?? entry.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(entry.createdAt, locale)}
                        {detail ? ` · ${detail}` : ""}
                      </span>
                    </div>
                    {isSensitive && entry.action !== "ACCOUNT_SECURED" && (
                      <SecureAccountAction locale={locale} variant="wasnt-me" />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {result.pagination.totalPages > 1 && (
            <div className="mt-2">
              <ProductPagination
                pagination={result.pagination}
                searchParams={Object.fromEntries(searchParams.entries())}
                basePath="/account/activity"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AccountActivityView;
