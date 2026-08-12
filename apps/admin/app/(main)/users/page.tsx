"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  listUsers,
  type UserListItem,
  type UserRole,
} from "@/lib/api/routes/users";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/i18n/format";
import { labelOf, userRoleLabels } from "@/lib/i18n/labels";
import { ui } from "@/lib/i18n/common";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

const ROLES: UserRole[] = ["BUYER", "SELLER", "RIDER", "ADMIN", "SUPPORT", "ACCOUNTANT"];

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [role, setRole] = useState<UserRole | "">("");

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        page,
        search: search || undefined,
        role: role || undefined,
      });
      setUsers(result.users);
      setTotalPages(result.pagination.totalPages);
      setTotal(result.pagination.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les utilisateurs."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional fetch on filter/page change
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, role]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function statusBadge(user: UserListItem) {
    if (user.deletedAt) return <Badge variant="destructive">Supprimé</Badge>;
    if (user.isBlocked) return <Badge variant="destructive">{ui.blocked}</Badge>;
    return <Badge variant="secondary">{ui.active}</Badge>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading
              ? ui.loading
              : `${total} utilisateur${total === 1 ? "" : "s"}`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher nom, e-mail, téléphone…"
            className="pl-8"
          />
        </form>
        <NativeSelect
          value={role}
          onChange={(e) => {
            setPage(1);
            setRole(e.target.value as UserRole | "");
          }}
          className="w-40"
        >
          <NativeSelectOption value="">{ui.allRoles}</NativeSelectOption>
          {ROLES.map((r) => (
            <NativeSelectOption key={r} value={r}>
              {labelOf(userRoleLabels, r)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <p className="text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{ui.name}</TableHead>
                <TableHead>{ui.contact}</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>{ui.status}</TableHead>
                <TableHead>{ui.joined}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={`/users/${user.id}`} className="hover:underline">
                      {user.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-xs">
                      <span>{user.email ?? "—"}</span>
                      <span className="text-muted-foreground">
                        {user.phone ?? "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {labelOf(userRoleLabels, user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>{statusBadge(user)}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatDate(user.createdAt)}
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
