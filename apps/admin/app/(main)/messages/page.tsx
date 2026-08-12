"use client";

import { useEffect, useState } from "react";
import { Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  assignContactMessageToMe,
  contactMessageStatusLabels,
  contactSubjectLabels,
  getContactMessage,
  listContactMessages,
  updateContactMessage,
  type ContactMessage,
  type ContactMessageStatus,
  type ContactMessageSubject,
} from "@/lib/api/routes/support";
import { getErrorMessage } from "@/lib/get-error-message";
import { formatDateTime } from "@/lib/i18n/format";
import { labelOf } from "@/lib/i18n/labels";
import { showErrorToast, showSuccessToast } from "@/lib/admin-toast";
import { useAuth } from "@/providers/auth-provider";
import { ui } from "@/lib/i18n/common";

const SUBJECTS = Object.keys(contactSubjectLabels) as ContactMessageSubject[];
const MESSAGE_STATUSES = Object.keys(
  contactMessageStatusLabels,
) as ContactMessageStatus[];

export default function MessagesPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<ContactMessageSubject | "">("");
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatus | "">(
    "",
  );
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [internalNote, setInternalNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const result = await listContactMessages({
        page,
        search: search || undefined,
        subject: subject || undefined,
        status: statusFilter || undefined,
        unread: unreadOnly || undefined,
      });
      setMessages(result.items);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Impossible de charger les messages."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, subject, statusFilter, unreadOnly]);

  async function openMessage(id: string) {
    setSelectedId(id);
    setSelectedMessage(null);
    setDetailError(null);
    setIsLoadingDetail(true);
    try {
      const data = await getContactMessage(id);
      setSelectedMessage(data);
      setInternalNote(data.internalNote ?? "");
      if (!data.isRead) {
        const updated = await updateContactMessage(id, { isRead: true });
        setSelectedMessage(updated);
        await load();
      }
    } catch (err) {
      setDetailError(getErrorMessage(err, "Impossible de charger ce message."));
    } finally {
      setIsLoadingDetail(false);
    }
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function truncate(text: string, max = 80) {
    if (text.length <= max) return text;
    return `${text.slice(0, max)}…`;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold">Messages de contact</h1>
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? ui.loading
            : `${total} message${total === 1 ? "" : "s"} reçu${total === 1 ? "" : "s"} via le formulaire d'aide`}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher nom, e-mail, contenu…"
            className="pl-8"
          />
        </form>
        <NativeSelect
          value={subject}
          onChange={(e) => {
            setPage(1);
            setSubject(e.target.value as ContactMessageSubject | "");
          }}
          className="w-56"
        >
          <NativeSelectOption value="">Tous les sujets</NativeSelectOption>
          {SUBJECTS.map((key) => (
            <NativeSelectOption key={key} value={key}>
              {contactSubjectLabels[key]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as ContactMessageStatus | "");
          }}
          className="w-44"
        >
          <NativeSelectOption value="">Tous les statuts</NativeSelectOption>
          {MESSAGE_STATUSES.map((s) => (
            <NativeSelectOption key={s} value={s}>
              {labelOf(contactMessageStatusLabels, s)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button
          type="button"
          variant={unreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setPage(1);
            setUnreadOnly((v) => !v);
          }}
        >
          Non lus
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Expéditeur</TableHead>
              <TableHead>Sujet</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Message</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-8 text-center text-sm"
                >
                  Aucun message de contact pour le moment.
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatDateTime(message.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="font-medium">{message.name}</div>
                    <div className="text-muted-foreground text-xs">
                      {message.email}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{message.subjectLabel}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">
                        {labelOf(contactMessageStatusLabels, message.status)}
                      </Badge>
                      {!message.isRead && (
                        <Badge variant="secondary">Non lu</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-md text-sm">
                    {truncate(message.message)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => openMessage(message.id)}
                    >
                      Lire
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
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
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setSelectedMessage(null);
            setDetailError(null);
            setInternalNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message de contact</DialogTitle>
            <DialogDescription>
              {selectedMessage
                ? `${selectedMessage.subjectLabel} · ${formatDateTime(selectedMessage.createdAt)}`
                : "Chargement…"}
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="flex flex-col gap-3 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailError ? (
            <p className="text-destructive text-sm">{detailError}</p>
          ) : selectedMessage ? (
            <div className="flex flex-col gap-4 py-2">
              <div>
                <p className="text-sm font-medium">{selectedMessage.name}</p>
                <p className="text-muted-foreground text-sm">
                  {selectedMessage.email}
                </p>
              </div>
              <div className="bg-muted rounded-md p-4 text-sm whitespace-pre-wrap">
                {selectedMessage.message}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <NativeSelect
                  value={selectedMessage.status}
                  onChange={async (e) => {
                    const status = e.target.value as ContactMessageStatus;
                    setIsSaving(true);
                    try {
                      const updated = await updateContactMessage(
                        selectedMessage.id,
                        { status },
                      );
                      setSelectedMessage(updated);
                      await load();
                    } catch (err) {
                      showErrorToast(
                        "Échec",
                        getErrorMessage(err, "Mise à jour impossible."),
                      );
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  {MESSAGE_STATUSES.map((s) => (
                    <NativeSelectOption key={s} value={s}>
                      {labelOf(contactMessageStatusLabels, s)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || selectedMessage.isRead}
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      const updated = await updateContactMessage(
                        selectedMessage.id,
                        { isRead: true },
                      );
                      setSelectedMessage(updated);
                      await load();
                    } catch (err) {
                      showErrorToast(
                        "Échec",
                        getErrorMessage(err, "Impossible de marquer comme lu."),
                      );
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  Marquer comme lu
                </Button>
              </div>

              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const updated = await assignContactMessageToMe(
                      selectedMessage.id,
                    );
                    setSelectedMessage(updated);
                    await load();
                    showSuccessToast(
                      "Assigné",
                      `Message assigné à ${user?.name ?? "vous"}.`,
                    );
                  } catch (err) {
                    showErrorToast(
                      "Échec",
                      getErrorMessage(err, "Assignation impossible."),
                    );
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Assigner à moi
              </Button>

              {selectedMessage.assignedTo && (
                <p className="text-muted-foreground text-xs">
                  Assigné à {selectedMessage.assignedTo.name}
                </p>
              )}

              <Textarea
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder="Note interne (non visible par l'expéditeur)…"
                rows={3}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    const updated = await updateContactMessage(
                      selectedMessage.id,
                      { internalNote },
                    );
                    setSelectedMessage(updated);
                    showSuccessToast("Note enregistrée", "");
                  } catch (err) {
                    showErrorToast(
                      "Échec",
                      getErrorMessage(err, "Impossible d'enregistrer la note."),
                    );
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                Enregistrer la note
              </Button>
            </div>
          ) : null}

          {selectedMessage && (
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedId(null)}
              >
                {ui.cancel}
              </Button>
              <Button
                type="button"
                nativeButton={false}
                render={
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subjectLabel}`}
                  />
                }
              >
                <Mail className="h-4 w-4" />
                Répondre par e-mail
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
