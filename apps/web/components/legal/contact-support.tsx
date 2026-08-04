"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supportApi } from "@/lib/api/routes/support";
import { ApiException } from "@/lib/api";

const SUBJECTS = [
  { value: "general", label: "Question générale" },
  { value: "account", label: "Compte et connexion" },
  { value: "order", label: "Commande" },
  { value: "payment", label: "Paiement / Retrait" },
  { value: "seller", label: "Compte Vendeur" },
  { value: "delivery", label: "Livraison" },
  { value: "privacy", label: "Confidentialité / Données personnelles" },
  { value: "other", label: "Autre" },
];

export function ContactSupport() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;
    setStatus("loading");

    try {
      await supportApi.contact({ name, email, subject, message });

      setStatus("success");
      setName("");
      setEmail("");
      setSubject(null);
      setMessage("");
    } catch (err) {
      setErrorMessage(
        err instanceof ApiException ? err.message : "Une erreur est survenue.",
      );
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/40 px-6 py-10 text-center">
        <CheckCircle2 className="h-8 w-8 text-primary" />
        <p className="text-sm font-medium text-foreground">
          Votre message a bien été envoyé
        </p>
        <p className="text-sm text-muted-foreground">
          Notre équipe vous répondra dans les plus brefs délais.
        </p>
        <Button variant="outline" size="sm" onClick={() => setStatus("idle")}>
          Envoyer un autre message
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <h2 className="text-lg font-semibold text-foreground">
        Contacter le support
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Une question sur cette page ou sur votre compte ? Écrivez-nous.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="name"
              className="text-sm font-medium text-foreground"
            >
              Nom
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="subject"
            className="text-sm font-medium text-foreground"
          >
            Sujet
          </label>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger id="subject">
              <SelectValue placeholder="Choisissez un sujet" />
            </SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="message"
            className="text-sm font-medium text-foreground"
          >
            Message
          </label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Décrivez votre demande..."
            rows={5}
            required
          />
        </div>

        {status === "error" && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <Button
          type="submit"
          disabled={status === "loading" || !subject}
          className="self-start"
        >
          {status === "loading" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          Envoyer
        </Button>
      </form>
    </div>
  );
}
