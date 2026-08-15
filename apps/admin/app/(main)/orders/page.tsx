"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listAdminOrders,
  getAdminOrder,
  cancelAdminOrder,
  requestAdminOrderRefundApproval,
  confirmAdminOrderRefund,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type OrderStatus,
} from "@/lib/api/routes/orders";
import { useAuth } from "@/providers/auth-provider";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf, orderStatusLabels } from "@/lib/i18n/labels";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { ui } from "@/lib/i18n/common";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { VerificationCodeDialog } from "@/components/dialogs/codes-dialog";

const STATUSES: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_SELLER_REVIEW",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "RIDER_ASSIGNED",
  "PICKED_UP",
  "ON_THE_WAY",
  "DELIVERED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "FAILED",
];

const CANCELLABLE: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "PENDING_SELLER_REVIEW",
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "RIDER_ASSIGNED",
];

const REFUNDABLE: OrderStatus[] = [
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
  "FAILED",
];

export default function OrdersPage() {
  const confirm = useConfirm();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isSupport = user?.role === "SUPPORT";

  const [items, setItems] = useState<AdminOrderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isActing, setIsActing] = useState(false);
  const [refundPendingId, setRefundPendingId] = useState<string | null>(null);
  const [refundApprovalContext, setRefundApprovalContext] = useState<{
    amount: number | string;
    currency: string;
    beneficiary: string;
    providerLabel: string;
  } | null>(null);
  const [refundOtpOpen, setRefundOtpOpen] = useState(false);
  const [refundOtpError, setRefundOtpError] = useState<string | null>(null);
  const [isConfirmingRefund, setIsConfirmingRefund] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAdminOrders({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setItems(data.items);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les commandes."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  async function openDetail(id: string) {
    setDetailId(id);
    setDetail(null);
    setDetailError(null);
    setCancelReason("");
    setDetailLoading(true);
    try {
      setDetail(await getAdminOrder(id));
    } catch (err) {
      setDetailError(
        getErrorMessage(err, "Impossible de charger la commande."),
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function reloadDetail() {
    if (!detailId) return;
    setDetail(await getAdminOrder(detailId));
    await load();
  }

  async function handleCancel() {
    if (!detailId) return;
    setIsActing(true);
    try {
      await cancelAdminOrder(detailId, cancelReason.trim() || undefined);
      showSuccessToast(
        "Commande annulée",
        "Le client et le vendeur ont été notifiés.",
      );
      await reloadDetail();
    } catch (err) {
      showErrorToast("Échec", getErrorMessage(err, "Annulation impossible."));
    } finally {
      setIsActing(false);
    }
  }

  async function handleRequestRefundApproval() {
    if (!detailId || !detail) return;

    const ok = await confirm({
      title: "Demander l'approbation du remboursement",
      description: `Demander le remboursement de ${detail.payment?.amount} ${detail.currency} à ${detail.buyer.name} ? Un code de vérification sera envoyé à votre e-mail administrateur.`,
      confirmLabel: "Envoyer le code de vérification",
      destructive: true,
    });
    if (!ok) return;

    setIsActing(true);
    setRefundOtpError(null);
    try {
      const result = await requestAdminOrderRefundApproval(detailId);
      setRefundPendingId(result.pendingId);
      setRefundApprovalContext({
        amount: result.summary.amount,
        currency: result.summary.currency,
        beneficiary: result.summary.beneficiary,
        providerLabel: "MbiyoPay (remboursement commande)",
      });
      setRefundOtpOpen(true);
      showSuccessToast("Code de vérification envoyé", result.message);
    } catch (err) {
      showErrorToast(
        "Échec de la demande d'approbation",
        getErrorMessage(
          err,
          "Impossible de demander l'approbation du remboursement.",
        ),
      );
    } finally {
      setIsActing(false);
    }
  }

  async function handleConfirmRefundOtp(code: string) {
    if (!detailId || !refundPendingId) return;
    setIsConfirmingRefund(true);
    setRefundOtpError(null);
    try {
      await confirmAdminOrderRefund(detailId, {
        pendingId: refundPendingId,
        code,
      });
      setRefundOtpOpen(false);
      setRefundPendingId(null);
      setRefundApprovalContext(null);
      showSuccessToast(
        "Remboursement approuvé",
        "Le remboursement a été soumis à MbiyoPay.",
      );
      await reloadDetail();
    } catch (err) {
      setRefundOtpError(getErrorMessage(err, "Code invalide ou expiré."));
    } finally {
      setIsConfirmingRefund(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  const canCancel =
    (isAdmin || isSupport) && detail && CANCELLABLE.includes(detail.status);
  const canRefund =
    isAdmin &&
    detail &&
    REFUNDABLE.includes(detail.status) &&
    detail.payment?.status === "SUCCEEDED";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Commandes</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? ui.loading
            : `${total} commande${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full max-w-xs"
        >
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ID, acheteur, boutique…"
            className="pl-8"
          />
        </form>
        <NativeSelect
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as OrderStatus | "");
          }}
          className="w-56"
        >
          <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
          {STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {labelOf(orderStatusLabels, s)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Acheteur</TableHead>
              <TableHead>Boutique</TableHead>
              <TableHead>Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  Aucune commande trouvée.
                </TableCell>
              </TableRow>
            ) : (
              items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-sm">{order.buyer.name}</TableCell>
                  <TableCell className="text-sm">{order.shop.name}</TableCell>
                  <TableCell className="text-sm">
                    {order.total} {order.currency}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {labelOf(orderStatusLabels, order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openDetail(order.id)}
                    >
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Précédent
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDetailId(null);
            setDetail(null);
            setDetailError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail commande</DialogTitle>
            <DialogDescription>
              {detail
                ? `${detail.id} · ${formatDateTime(detail.createdAt)}`
                : "Chargement…"}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : detailError ? (
            <p className="text-destructive text-sm">{detailError}</p>
          ) : detail ? (
            <div className="flex flex-col gap-4 py-2 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  {labelOf(orderStatusLabels, detail.status)}
                </Badge>
                <Badge variant="secondary">{detail.paymentMethod}</Badge>
                <Badge variant="secondary">{detail.fulfillmentMethod}</Badge>
                {detail.payment && (
                  <Badge variant="outline">
                    Paiement : {detail.payment.status}
                  </Badge>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Acheteur</p>
                  <p>{detail.buyer.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Boutique</p>
                  <p>{detail.shop.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total</p>
                  <p className="font-medium">
                    {detail.total} {detail.currency}
                  </p>
                </div>
                {detail.deliveryAddress && (
                  <div>
                    <p className="text-muted-foreground text-xs">Adresse</p>
                    <p>{detail.deliveryAddress}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium">Articles</p>
                <div className="divide-y rounded-md border">
                  {detail.items.map((item) => (
                    <div key={item.id} className="flex justify-between p-3">
                      <div>
                        <p>{item.productName}</p>
                        {item.variantName && (
                          <p className="text-muted-foreground text-xs">
                            {item.variantName}
                          </p>
                        )}
                      </div>
                      <p>
                        {item.quantity} × {item.unitPrice} = {item.subtotal}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {(detail.cancelReason ||
                detail.rejectionReason ||
                detail.failureReason) && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  {detail.cancelReason && (
                    <p>Annulation : {detail.cancelReason}</p>
                  )}
                  {detail.rejectionReason && (
                    <p>Rejet : {detail.rejectionReason}</p>
                  )}
                  {detail.failureReason && (
                    <p>Échec : {detail.failureReason}</p>
                  )}
                </div>
              )}

              {canCancel && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium">Annuler la commande</p>
                  <Textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Motif visible dans l'historique…"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isActing}
                    onClick={handleCancel}
                  >
                    Annuler la commande
                  </Button>
                </div>
              )}

              {canRefund && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isActing}
                  onClick={handleRequestRefundApproval}
                >
                  Demander le remboursement (OTP)
                </Button>
              )}
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDetailId(null)}
            >
              {ui.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VerificationCodeDialog
        open={refundOtpOpen}
        onOpenChange={setRefundOtpOpen}
        type="payout-approval"
        context={refundApprovalContext ?? undefined}
        onSubmit={handleConfirmRefundOtp}
        isSubmitting={isConfirmingRefund}
        error={refundOtpError}
      />
    </div>
  );
}
