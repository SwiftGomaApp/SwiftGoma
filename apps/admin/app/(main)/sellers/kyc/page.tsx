"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { listKyc, type KycListItem, type KycStatus } from "@/lib/api/routes/sellers";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/i18n/format";
import {
  labelOf,
  kycStatusLabels,
  idDocumentTypeLabels,
} from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

function statusVariant(status: KycStatus): "default" | "secondary" | "destructive" {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

const STATUSES: KycStatus[] = [
  "PENDING",
  "SUPPORT_REVIEWED",
  "APPROVED",
  "REJECTED",
];

export default function KycReviewPage() {
  const [records, setRecords] = useState<KycListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<KycStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listKyc({ page, status: status || undefined });
      setRecords(result.records);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les soumissions KYC."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on filter/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Revue KYC</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? ui.loading
            : `${total} soumission${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <NativeSelect
        value={status}
        onChange={(e) => {
          setPage(1);
          setStatus(e.target.value as KycStatus | "");
        }}
        className="w-48"
      >
        <NativeSelectOption value="">{ui.allStatuses}</NativeSelectOption>
        {STATUSES.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {labelOf(kycStatusLabels, s)}
          </NativeSelectOption>
        ))}
      </NativeSelect>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucune soumission trouvée.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>{ui.contact}</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>{ui.status}</TableHead>
                <TableHead>Soumise le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/sellers/kyc/${record.id}`}
                      className="hover:underline"
                    >
                      {record.sellerProfile.businessName}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>{record.sellerProfile.contactEmail}</span>
                      <span className="text-muted-foreground">
                        {record.sellerProfile.contactPhone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {labelOf(idDocumentTypeLabels, record.idDocumentType)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(record.status)}>
                      {labelOf(kycStatusLabels, record.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(record.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
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
