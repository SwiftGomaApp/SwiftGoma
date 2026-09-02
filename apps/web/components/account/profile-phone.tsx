"use client";

import { useState } from "react";
import { Phone, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { isApiError } from "@/lib/api/client";
import {
  requestPhoneUpdate,
  requestPhoneVerification,
  verifyPhone,
  verifyPhoneUpdate,
} from "@/lib/api/routes/users.routes";
import { useAuth } from "@/lib/auth/auth-context";
import type { Locale } from "@/lib/language";
import {
  OtpDialog,
  type OtpStatus,
} from "@/components/auth/modals/otp-dialog";

const STRINGS = {
  en: {
    title: "Phone number",
    description: "Used for delivery updates and account verification.",
    empty: "No phone number added yet.",
    add: "Add phone",
    change: "Change",
    verify: "Verify",
    verified: "Verified",
    pending: "Pending verification",
    pendingChange: (phone: string) => `Verifying ${phone}…`,
    phoneLabel: "Phone number",
    phonePlaceholder: "+243900000000",
    send: "Send code",
    cancel: "Cancel",
    invalidPhone: "Please enter a valid phone number, e.g. +243900000000.",
    genericError: "Something went wrong. Please try again.",
    otpTitle: "Verify your phone number",
    otpDescription: "Enter the code we sent by SMS to confirm this number.",
  },
  fr: {
    title: "Numéro de téléphone",
    description:
      "Utilisé pour les mises à jour de livraison et la vérification du compte.",
    empty: "Aucun numéro de téléphone ajouté pour le moment.",
    add: "Ajouter un numéro",
    change: "Changer",
    verify: "Vérifier",
    verified: "Vérifié",
    pending: "Vérification en attente",
    pendingChange: (phone: string) => `Vérification de ${phone}…`,
    phoneLabel: "Numéro de téléphone",
    phonePlaceholder: "+243900000000",
    send: "Envoyer le code",
    cancel: "Annuler",
    invalidPhone:
      "Veuillez entrer un numéro de téléphone valide, ex. +243900000000.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    otpTitle: "Vérifiez votre numéro de téléphone",
    otpDescription:
      "Entrez le code que nous avons envoyé par SMS pour confirmer ce numéro.",
  },
} as const;

const PHONE_RE = /^\+[1-9]\d{7,14}$/;

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function ProfilePhone({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];
  const { user, refresh } = useAuth();

  const currentPhone = user?.phone ?? null;
  const isVerified = Boolean(user?.isPhoneVerified);
  const pendingPhone = user?.pendingPhone ?? null;
  // Updating an already-verified number targets `pendingPhone`; adding or
  // re-verifying a first number targets `phone` itself.
  const isUpdatingExisting = isVerified;

  const [editing, setEditing] = useState(false);
  const [phone, setPhone] = useState("");
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [verifyingPhone, setVerifyingPhone] = useState("");

  function startEditing() {
    setPhone("");
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function sendCode(targetPhone: string) {
    setError(null);
    if (!PHONE_RE.test(targetPhone)) {
      setError(t.invalidPhone);
      return;
    }
    setRequesting(true);
    try {
      if (isUpdatingExisting) {
        await requestPhoneUpdate({ newPhone: targetPhone });
      } else {
        await requestPhoneVerification({ phone: targetPhone });
      }
      setVerifyingPhone(targetPhone);
      setEditing(false);
      setOtpStatus("idle");
      setOtpOpen(true);
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setRequesting(false);
    }
  }

  async function handleOtpSubmit(code: string) {
    setOtpLoading(true);
    try {
      if (isUpdatingExisting) {
        await verifyPhoneUpdate({ code, locale });
      } else {
        await verifyPhone({ code, locale });
      }
      await refresh();
      setOtpStatus("success");
    } catch (err) {
      console.error(err);
      setOtpStatus("error");
    } finally {
      setOtpLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {!currentPhone && !editing && (
          <Button type="button" variant="outline" onClick={startEditing}>
            <Phone className="size-4" />
            {t.add}
          </Button>
        )}
      </div>

      {currentPhone && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 sm:max-w-sm">
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{currentPhone}</span>
          </div>

          <div className="flex items-center gap-2">
            {isVerified ? (
              <Badge variant="secondary">{t.verified}</Badge>
            ) : (
              <Badge variant="outline">{t.pending}</Badge>
            )}

            {!editing &&
              (isVerified ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={startEditing}
                >
                  {t.change}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={requesting}
                  onClick={() => sendCode(currentPhone)}
                >
                  {t.verify}
                </Button>
              ))}
          </div>
        </div>
      )}

      {pendingPhone && (
        <p className="text-sm text-muted-foreground">
          {t.pendingChange(pendingPhone)}
        </p>
      )}

      {!currentPhone && !editing && (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      )}

      {editing && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:max-w-sm">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="profile-phone">{t.phoneLabel}</FieldLabel>
              <Input
                id="profile-phone"
                type="tel"
                placeholder={t.phonePlaceholder}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </Field>

            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => sendCode(phone.trim())}
                disabled={requesting || !phone.trim()}
              >
                {requesting && <Loader2 className="size-4 animate-spin" />}
                {t.send}
              </Button>
              <Button type="button" variant="ghost" onClick={cancelEditing}>
                {t.cancel}
              </Button>
            </div>
          </FieldGroup>
        </div>
      )}

      <OtpDialog
        open={otpOpen}
        onOpenChange={setOtpOpen}
        mode="email-verification"
        locale={locale}
        email={verifyingPhone}
        loading={otpLoading}
        status={otpStatus}
        onStatusChange={setOtpStatus}
        title={t.otpTitle}
        description={t.otpDescription}
        onSubmit={handleOtpSubmit}
        onResend={() => sendCode(verifyingPhone)}
        successTitle={t.verified}
        onSuccessAction={() => setOtpOpen(false)}
      />
    </section>
  );
}

export default ProfilePhone;
