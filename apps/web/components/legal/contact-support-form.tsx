"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { apiPost, isApiError } from "@/lib/api/client";
import { SUPPORT_ROUTES } from "@/lib/api/routes/support.routes";
import { Locale } from "@/lib/language";

// Keys must match SUBJECT_LABELS in server/src/features/support/services/support.service.js
type ContactSubject =
  | "general"
  | "account"
  | "order"
  | "payment"
  | "seller"
  | "delivery"
  | "privacy"
  | "other";

type ContactMessageResponse = {
  id: string;
  received: boolean;
};

const SUBJECT_OPTIONS: Record<Locale, Record<ContactSubject, string>> = {
  en: {
    general: "General question",
    account: "Account & sign-in",
    order: "Order",
    payment: "Payment / Payout",
    seller: "Seller account",
    delivery: "Delivery",
    privacy: "Privacy / Personal data",
    other: "Other",
  },
  fr: {
    general: "Question générale",
    account: "Compte et connexion",
    order: "Commande",
    payment: "Paiement / Retrait",
    seller: "Compte Vendeur",
    delivery: "Livraison",
    privacy: "Confidentialité / Données personnelles",
    other: "Autre",
  },
};

const CONTACT_STRINGS = {
  en: {
    title: "Contact support",
    description: "Send us a message and we'll get back to you by email.",
    name: "Name",
    email: "Email",
    subject: "Subject",
    message: "Message",
    send: "Send message",
    sending: "Sending...",
    genericError: "Something went wrong. Please try again.",
    successTitle: "Message sent",
    successDescription: "Thanks — our support team will reply by email.",
    sendAnother: "Send another message",
  },
  fr: {
    title: "Contacter le support",
    description: "Envoyez-nous un message, nous vous répondrons par e-mail.",
    name: "Nom",
    email: "E-mail",
    subject: "Sujet",
    message: "Message",
    send: "Envoyer le message",
    sending: "Envoi...",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    successTitle: "Message envoyé",
    successDescription:
      "Merci — notre équipe support vous répondra par e-mail.",
    sendAnother: "Envoyer un autre message",
  },
} as const;

export function ContactSupportForm({ locale }: { locale: Locale }) {
  const t = CONTACT_STRINGS[locale];
  const subjects = SUBJECT_OPTIONS[locale];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<ContactSubject>("general");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading || !name.trim() || !email.trim() || !message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await apiPost<ContactMessageResponse>(SUPPORT_ROUTES.contact, {
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      });

      setSent(true);
      setName("");
      setEmail("");
      setSubject("general");
      setMessage("");
    } catch (err) {
      if (isApiError(err) && err.response?.data?.error?.message) {
        setError(err.response.data.error.message);
      } else {
        setError(t.genericError);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <section className="space-y-3 scroll-mt-10">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t.title}
        </h2>

        <div className="flex flex-col items-center gap-2 rounded-md border border-border p-8 text-center">
          <CheckCircle2 className="size-8 text-green-500" />
          <p className="text-sm font-medium text-foreground">
            {t.successTitle}
          </p>
          <p className="text-sm text-muted-foreground">
            {t.successDescription}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSent(false)}
          >
            {t.sendAnother}
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4 scroll-mt-10">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          {t.title}
        </h2>
        <p className="text-sm text-muted-foreground">{t.description}</p>
      </div>

      <form onSubmit={handleSubmit}>
        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="contact-name">{t.name}</FieldLabel>
              <Input
                id="contact-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact-email">{t.email}</FieldLabel>
              <Input
                id="contact-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="contact-subject">{t.subject}</FieldLabel>
            <NativeSelect
              id="contact-subject"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value as ContactSubject)}
              disabled={loading}
            >
              {(Object.entries(subjects) as [ContactSubject, string][]).map(
                ([key, label]) => (
                  <NativeSelectOption key={key} value={key}>
                    {label}
                  </NativeSelectOption>
                ),
              )}
            </NativeSelect>
          </Field>

          <Field>
            <FieldLabel htmlFor="contact-message">{t.message}</FieldLabel>

            <Textarea
              id="contact-message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              disabled={loading}
              className="min-h-82.5 resize-y"
            />
          </Field>

          {error && (
            <FieldDescription className="text-destructive">
              {error}
            </FieldDescription>
          )}

          <Field orientation="responsive">
            <Button
              type="submit"
              className="sm:w-auto"
              disabled={
                loading || !name.trim() || !email.trim() || !message.trim()
              }
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {loading ? t.sending : t.send}
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </section>
  );
}
