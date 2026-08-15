"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  getKyc,
  supportReviewKyc,
  approveKyc,
  rejectKyc,
  type KycDetail,
  type KycStatus,
} from "@/lib/api/routes/sellers";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";
import { formatDateTime } from "@/lib/i18n/format";x
import {
  labelOf,
  kycStatusLabels,
  idDocumentTypeLabels,
} from "@/lib/i18n/labels";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function statusVariant(
  status: KycStatus,
): "default" | "secondary" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md border p-3 text-sm hover:bg-muted"
    >
      <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ExternalLink className="text-muted-foreground h-3.5 w-3.5" />
    </a>
  );
}

function ImagePreviewLink({
  label,
  url,
}: {
  label: string;
  url: string | null;
}) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex flex-col gap-2 rounded-md border p-3 text-sm hover:bg-muted"
    >
      <div className="flex items-center gap-2">
        <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
        <span className="flex-1">{label}</span>
        <ExternalLink className="text-muted-foreground h-3.5 w-3.5" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={label}
        className="h-40 w-full rounded-md border object-cover"
      />
    </a>
  );
}

export default function KycDetailPage() {
  const params = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [callNotes, setCallNotes] = useState("");
  const [showCallNotesForm, setShowCallNotesForm] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getKyc(params.id);
      setKyc(result);
    } catch (err) {
      setError(
        getErrorMessage(err, "Impossible de charger cette soumission KYC."),
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch-on-mount
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function runAction(action: () => Promise<unknown>) {
    setActionError(null);
    setIsActing(true);
    try {
      await action();
      await load();
      setShowRejectForm(false);
      setRejectReason("");
      setShowCallNotesForm(false);
      setCallNotes("");
    } catch (err) {
      setActionError(getErrorMessage(err, "Cette action a échoué."));
    } finally {
      setIsActing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !kyc) {
    return (
      <div className="flex flex-col gap-3">
        <Link
          href="/sellers/kyc"
          className="text-muted-foreground text-sm hover:underline"
        >
          <ArrowLeft className="mr-1 inline h-3.5 w-3.5" />
          Retour à la revue KYC
        </Link>
        <p className="text-destructive text-sm">
          {error ?? "Soumission introuvable."}
        </p>
      </div>
    );
  }

  const isFinal = kyc.status === "APPROVED" || kyc.status === "REJECTED";
  const canApprove = currentUser?.role === "ADMIN";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/sellers/kyc"
            className="text-muted-foreground text-xs hover:underline"
          >
            <ArrowLeft className="mr-1 inline h-3 w-3" />
            Retour à la revue KYC
          </Link>
          <h1 className="mt-1 text-xl font-bold">
            {kyc.sellerProfile.businessName}
          </h1>
        </div>
        <Badge variant={statusVariant(kyc.status)}>
          {labelOf(kycStatusLabels, kyc.status)}
        </Badge>
      </div>

      {actionError && <p className="text-destructive text-sm">{actionError}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informations entreprise</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">Propriétaire :</span>{" "}
              {kyc.sellerProfile.user.name}
            </p>
            <p>
              <span className="text-muted-foreground">E-mail :</span>{" "}
              {kyc.sellerProfile.user.emails.find((e) => e.isPrimary)?.email ??
                kyc.sellerProfile.contactEmail}
            </p>
            <p>
              <span className="text-muted-foreground">Téléphone :</span>{" "}
              {kyc.sellerProfile.contactPhone}
            </p>
            <p>
              <span className="text-muted-foreground">WhatsApp :</span>{" "}
              {kyc.sellerProfile.whatsappNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Adresse :</span>{" "}
              {kyc.sellerProfile.address}, {kyc.sellerProfile.city}
            </p>
            <p>
              <span className="text-muted-foreground">Description :</span>{" "}
              {kyc.sellerProfile.businessDescription}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Documents</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <DocLink
              label={`Pièce d'identité (${labelOf(idDocumentTypeLabels, kyc.idDocumentType)})`}
              url={kyc.idDocumentUrl}
            />
            <DocLink
              label="Justificatif de domicile"
              url={kyc.proofOfAddressUrl}
            />
            <ImagePreviewLink label="Selfie" url={kyc.selfieUrl} />
            {kyc.rccmNumber && (
              <DocLink
                label={`Document RCCM (${kyc.rccmNumber})`}
                url={kyc.rccmDocumentUrl}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {kyc.rejectionReason && (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm">
            <span className="text-destructive font-medium">
              Motif de rejet :
            </span>{" "}
            {kyc.rejectionReason}
          </CardContent>
        </Card>
      )}

      {!isFinal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Revue</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {kyc.status === "PENDING" && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isActing}
                  onClick={() => setShowCallNotesForm((v) => !v)}
                >
                  Marquer revu par le support
                </Button>
              )}
              <Button
                size="sm"
                disabled={isActing || !canApprove}
                title={
                  canApprove
                    ? undefined
                    : "Seul un ADMIN peut approuver définitivement"
                }
                onClick={() => {
                  if (
                    !confirm(
                      `Approuver le KYC de ${kyc.sellerProfile.businessName} ?`,
                    )
                  )
                    return;
                  runAction(() => approveKyc(kyc.id));
                }}
              >
                Approuver
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isActing}
                onClick={() => setShowRejectForm((v) => !v)}
              >
                Rejeter
              </Button>
            </div>

            {showCallNotesForm && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={callNotes}
                  onChange={(e) => setCallNotes(e.target.value)}
                  placeholder="Notes d'appel (obligatoire pour marquer ce dossier comme revu)"
                  className="border-input min-h-20 rounded-md border bg-transparent p-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  size="sm"
                  className="w-fit"
                  disabled={isActing || !callNotes.trim()}
                  onClick={() =>
                    runAction(() => supportReviewKyc(kyc.id, callNotes.trim()))
                  }
                >
                  Confirmer la revue
                </Button>
              </div>
            )}

            {showRejectForm && (
              <div className="flex flex-col gap-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Motif de rejet (visible par le vendeur)"
                  className="border-input min-h-20 rounded-md border bg-transparent p-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-fit"
                  disabled={isActing || !rejectReason.trim()}
                  onClick={() =>
                    runAction(() => rejectKyc(kyc.id, rejectReason.trim()))
                  }
                >
                  Confirmer le rejet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Historique de revue</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-xs text-muted-foreground">
          <p>Soumise le : {formatDateTime(kyc.createdAt)}</p>
          {kyc.supportReviewedAt && (
            <p>
              Revu par le support le : {formatDateTime(kyc.supportReviewedAt)}
            </p>
          )}
          {kyc.callNotes && <p>Notes d&apos;appel : {kyc.callNotes}</p>}
          {kyc.adminReviewedAt && (
            <p>
              Approuvé par l'admin le : {formatDateTime(kyc.adminReviewedAt)}
            </p>
          )}
          {kyc.rejectedAt && (
            <p>Rejeté le : {formatDateTime(kyc.rejectedAt)}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
