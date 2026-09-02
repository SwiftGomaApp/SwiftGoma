"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Fingerprint,
  KeyRound,
  Mail,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { SecurityPassword } from "@/components/account/security-password";
import { SecurityTwoFactor } from "@/components/account/security-two-factor";
import { SecurityPasskeys } from "@/components/account/security-passkeys";
import { ProfileSecondaryEmail } from "@/components/account/profile-secondary-email";
import { useAuth } from "@/lib/auth/auth-context";
import {
  dismissSecurityChecklist,
  getSecurityChecklistStatus,
  isSecurityBarMet,
  isSecurityChecklistDismissed,
  type SecurityChecklistItemId,
} from "@/lib/security-checklist";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Secure your account",
    description: "A few quick steps to make your account harder to break into.",
    notNow: "Not now",
    back: "Back",
    done: "Done",
    action: "Set up",
    items: {
      twoFactor: {
        title: "Enable two-factor authentication",
        description: "Add a second step at sign-in using an authenticator app.",
      },
      passkey: {
        title: "Add a passkey",
        description:
          "Sign in with your device's fingerprint or face instead of a password.",
      },
      password: {
        title: "Set a password",
        description: "Have a backup way to sign in besides Google.",
      },
      secondaryEmail: {
        title: "Add a secondary email",
        description: "A backup way to reach you and recover your account.",
      },
    },
  },
  fr: {
    title: "Sécurisez votre compte",
    description:
      "Quelques étapes rapides pour rendre votre compte plus difficile à pirater.",
    notNow: "Plus tard",
    back: "Retour",
    done: "Terminé",
    action: "Configurer",
    items: {
      twoFactor: {
        title: "Activer l'authentification à deux facteurs",
        description:
          "Ajoutez une étape supplémentaire à la connexion via une application d'authentification.",
      },
      passkey: {
        title: "Ajouter une clé d'accès",
        description:
          "Connectez-vous avec l'empreinte digitale ou le visage de votre appareil, sans mot de passe.",
      },
      password: {
        title: "Définir un mot de passe",
        description:
          "Ayez un moyen de secours pour vous connecter en plus de Google.",
      },
      secondaryEmail: {
        title: "Ajouter un e-mail secondaire",
        description:
          "Un moyen de secours pour vous contacter et récupérer votre compte.",
      },
    },
  },
} as const;

const ITEM_ICONS: Record<SecurityChecklistItemId, LucideIcon> = {
  twoFactor: ShieldCheck,
  passkey: Fingerprint,
  password: KeyRound,
  secondaryEmail: Mail,
};

const ITEM_ORDER: SecurityChecklistItemId[] = [
  "twoFactor",
  "passkey",
  "password",
  "secondaryEmail",
];

export function SecurityChecklistModal({ locale }: { locale: Locale }) {
  const { user, refresh } = useAuth();
  const t = STRINGS[locale];

  const shownRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<SecurityChecklistItemId | null>(
    null,
  );

  useEffect(() => {
    if (!user || shownRef.current) return;
    if (isSecurityBarMet(user)) return; // cheap check on current data first
    if (isSecurityChecklistDismissed()) return;

    let cancelled = false;
    (async () => {
      // Some login responses don't include the passkeys relation — force a
      // fresh /auth/me so the "do they already have a strong factor" check
      // never runs on incomplete data.
      const fresh = await refresh();
      if (!cancelled && fresh && !isSecurityBarMet(fresh)) {
        shownRef.current = true;
        setOpen(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, refresh]);

  function handleOpenChange(next: boolean) {
    if (!next) {
      dismissSecurityChecklist();
      setActiveItem(null);
    }
    setOpen(next);
  }

  function handleNotNow() {
    dismissSecurityChecklist();
    setOpen(false);
    setActiveItem(null);
  }

  if (!user) return null;

  const status = getSecurityChecklistStatus(user);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {activeItem ? (
          <>
            <DialogHeader>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mb-2 w-fit gap-1.5 px-2 text-muted-foreground"
                onClick={() => setActiveItem(null)}
              >
                <ArrowLeft className="size-4" />
                {t.back}
              </Button>
              <DialogTitle className="sr-only">
                {t.items[activeItem].title}
              </DialogTitle>
            </DialogHeader>

            {activeItem === "password" && <SecurityPassword locale={locale} />}
            {activeItem === "twoFactor" && (
              <SecurityTwoFactor locale={locale} />
            )}
            {activeItem === "passkey" && <SecurityPasskeys locale={locale} />}
            {activeItem === "secondaryEmail" && (
              <ProfileSecondaryEmail locale={locale} />
            )}
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription>{t.description}</DialogDescription>
            </DialogHeader>

            <ItemGroup>
              {ITEM_ORDER.map((id) => {
                const Icon = ITEM_ICONS[id];
                const isDone = status[id];
                return (
                  <Item key={id} variant="outline">
                    <ItemMedia variant="icon">
                      <Icon />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{t.items[id].title}</ItemTitle>
                      <ItemDescription>
                        {t.items[id].description}
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      {isDone ? (
                        <Badge variant="default">{t.done}</Badge>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveItem(id)}
                        >
                          {t.action}
                        </Button>
                      )}
                    </ItemActions>
                  </Item>
                );
              })}
            </ItemGroup>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={handleNotNow}
            >
              {t.notNow}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SecurityChecklistModal;
