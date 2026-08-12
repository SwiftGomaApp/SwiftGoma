"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { listUsers, type UserListItem } from "@/lib/api/routes/users";
import {
  suspendSellerProfile,
  reactivateSellerProfile,
} from "@/lib/api/routes/sellers";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/i18n/format";
import { labelOf, sellerProfileStatusLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function profileStatusVariant(
  status: string | undefined,
): "default" | "secondary" | "destructive" {
  if (status === "ACTIVE") return "default";
  if (status === "SUSPENDED") return "destructive";
  return "secondary";
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<UserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        page,
        role: "SELLER",
        search: search || undefined,
      });
      setSellers(result.users);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les vendeurs."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on filter/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleSuspend(userId: string) {
    const reason = window.prompt(
      "Motif de suspension du profil vendeur (obligatoire) :",
    );
    if (!reason?.trim()) return;
    setActingId(userId);
    setRowError(null);
    try {
      await suspendSellerProfile(userId, reason.trim());
      await load();
    } catch (err) {
      setRowError(getErrorMessage(err, "Impossible de suspendre ce vendeur."));
    } finally {
      setActingId(null);
    }
  }

  async function handleReactivate(userId: string) {
    setActingId(userId);
    setRowError(null);
    try {
      await reactivateSellerProfile(userId);
      await load();
    } catch (err) {
      setRowError(getErrorMessage(err, "Impossible de réactiver ce vendeur."));
    } finally {
      setActingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Vendeurs</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? ui.loading
              : `${total} vendeur${total === 1 ? "" : "s"}`}
          </p>
        </div>
        <Link href="/sellers/kyc" className="text-primary text-sm hover:underline">
          Examiner les soumissions KYC →
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher nom, e-mail, téléphone…"
          className="pl-8"
        />
      </form>

      {error && <p className="text-destructive text-sm">{error}</p>}
      {rowError && <p className="text-destructive text-sm">{rowError}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun vendeur trouvé.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ui.name}</TableHead>
                <TableHead>{ui.contact}</TableHead>
                <TableHead>Statut du profil</TableHead>
                <TableHead>Compte</TableHead>
                <TableHead>{ui.joined}</TableHead>
                <TableHead className="text-right">{ui.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((seller) => {
                const profileStatus = seller.sellerProfile?.status;
                const canSuspend = profileStatus === "ACTIVE";
                const canReactivate = profileStatus === "SUSPENDED";

                return (
                <TableRow key={seller.id}>
                  <TableCell className="font-medium">
                    <Link href={`/users/${seller.id}`} className="hover:underline">
                      {seller.name}
                    </Link>
                    {seller.sellerProfile?.businessName && (
                      <p className="text-muted-foreground text-xs font-normal">
                        {seller.sellerProfile.businessName}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>{seller.email ?? "—"}</span>
                      <span className="text-muted-foreground">
                        {seller.phone ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profileStatusVariant(profileStatus)}>
                      {profileStatus
                        ? labelOf(sellerProfileStatusLabels, profileStatus)
                        : "Aucun profil"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {seller.isBlocked ? (
                      <Badge variant="destructive">{ui.blocked}</Badge>
                    ) : (
                      <Badge variant="outline">OK</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(seller.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {canSuspend && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === seller.id}
                        onClick={() => handleSuspend(seller.id)}
                      >
                        Suspendre le profil
                      </Button>
                    )}
                    {canReactivate && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actingId === seller.id}
                        onClick={() => handleReactivate(seller.id)}
                      >
                        Réactiver
                      </Button>
                    )}
                    {!canSuspend && !canReactivate && (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-xs">
              {ui.pageOf(page, totalPages)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {ui.previous}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {ui.next}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
