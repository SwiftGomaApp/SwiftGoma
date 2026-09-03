"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { isApiError } from "@/lib/api/client";
import {
  createAddress,
  deleteAddress,
  listAddresses,
  setDefaultAddress,
  updateAddress,
  type Address,
} from "@/lib/api/routes/addresses.routes";
import type { Locale } from "@/lib/language";

const STRINGS = {
  en: {
    title: "Addresses",
    description: "Saved delivery addresses for faster checkout.",
    add: "Add address",
    edit: "Edit",
    delete: "Delete",
    setDefault: "Set as default",
    default: "Default",
    empty: "No saved addresses yet.",
    labelField: "Label",
    labelPlaceholder: "Home, Work…",
    recipientName: "Recipient name",
    recipientPhone: "Recipient phone",
    address: "Reference",
    addressPlaceholder: "Street, avenue, landmark…",
    city: "City / commune",
    makeDefault: "Use as default address",
    save: "Save",
    cancel: "Cancel",
    deleteConfirmTitle: "Delete this address?",
    deleteConfirmDescription: "This can't be undone.",
    confirmDelete: "Delete",
    addressRequired: "Please enter an address.",
    genericError: "Something went wrong. Please try again.",
    locating: "Locating you…",
    locationCaptured: "Location captured",
    locationError:
      "Couldn't get your location. Allow location access and try again.",
    retryLocation: "Retry",
    locationRequiredError:
      "We need your location to save this address for delivery — allow access and retry.",
  },
  fr: {
    title: "Adresses",
    description:
      "Adresses de livraison enregistrées pour un paiement plus rapide.",
    add: "Ajouter une adresse",
    edit: "Modifier",
    delete: "Supprimer",
    setDefault: "Définir par défaut",
    default: "Par défaut",
    empty: "Aucune adresse enregistrée pour le moment.",
    labelField: "Nom",
    labelPlaceholder: "Domicile, Travail…",
    recipientName: "Nom du destinataire",
    recipientPhone: "Téléphone du destinataire",
    address: "Reference",
    addressPlaceholder: "Rue, avenue, point de repère…",
    city: "Ville / commune",
    makeDefault: "Utiliser comme adresse par défaut",
    save: "Enregistrer",
    cancel: "Annuler",
    deleteConfirmTitle: "Supprimer cette adresse ?",
    deleteConfirmDescription: "Cette action est irréversible.",
    confirmDelete: "Supprimer",
    addressRequired: "Veuillez entrer une adresse.",
    genericError: "Une erreur est survenue. Veuillez réessayer.",
    locating: "Localisation en cours…",
    locationCaptured: "Position enregistrée",
    locationError:
      "Impossible d'obtenir votre position. Autorisez la localisation et réessayez.",
    retryLocation: "Réessayer",
    locationRequiredError:
      "Nous avons besoin de votre position pour enregistrer cette adresse pour la livraison — autorisez l'accès et réessayez.",
  },
} as const;

type FormState = {
  label: string;
  recipientName: string;
  recipientPhone: string;
  address: string;
  city: string;
  isDefault: boolean;
};

const EMPTY_FORM: FormState = {
  label: "",
  recipientName: "",
  recipientPhone: "",
  address: "",
  city: "",
  isDefault: false,
};

function extractMessage(err: unknown, fallback: string): string {
  if (isApiError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message;
  }
  return fallback;
}

export function ProfileAddresses({ locale }: { locale: Locale }) {
  const t = STRINGS[locale];

  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    listAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  function requestLocation() {
    setLocationError(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError(t.locationError);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocating(false);
      },
      () => {
        setLocationError(t.locationError);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function startCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setEditingId(null);
    setCreating(true);
    setCoords(null);
    setLocationError(null);
    requestLocation();
  }

  function startEdit(address: Address) {
    setForm({
      label: address.label ?? "",
      recipientName: address.recipientName ?? "",
      recipientPhone: address.recipientPhone ?? "",
      address: address.address,
      city: address.city ?? "",
      isDefault: address.isDefault,
    });
    setError(null);
    setCreating(false);
    setEditingId(address.id);
    setLocationError(null);
    if (address.latitude != null && address.longitude != null) {
      setCoords({ lat: address.latitude, lng: address.longitude });
    } else {
      setCoords(null);
      requestLocation();
    }
  }

  function closeForm() {
    setCreating(false);
    setEditingId(null);
    setError(null);
    setCoords(null);
    setLocationError(null);
    setLocating(false);
  }

  async function handleSubmit() {
    setError(null);
    if (!form.address.trim()) {
      setError(t.addressRequired);
      return;
    }
    if (!coords) {
      setError(t.locationRequiredError);
      return;
    }

    const body = {
      label: form.label.trim() || undefined,
      recipientName: form.recipientName.trim() || undefined,
      recipientPhone: form.recipientPhone.trim() || undefined,
      address: form.address.trim(),
      city: form.city.trim() || undefined,
      isDefault: form.isDefault,
      latitude: coords.lat,
      longitude: coords.lng,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        const updated = await updateAddress(editingId, body);
        setAddresses((prev) =>
          (prev ?? [])
            .map((a) => (a.id === updated.id ? updated : a))
            .map((a) =>
              updated.isDefault && a.id !== updated.id
                ? { ...a, isDefault: false }
                : a,
            ),
        );
      } else {
        const created = await createAddress(body);
        setAddresses((prev) => {
          const rest = created.isDefault
            ? (prev ?? []).map((a) => ({ ...a, isDefault: false }))
            : (prev ?? []);
          return [created, ...rest];
        });
      }
      closeForm();
    } catch (err) {
      setError(extractMessage(err, t.genericError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    try {
      await setDefaultAddress(id);
      setAddresses((prev) =>
        (prev ?? []).map((a) => ({ ...a, isDefault: a.id === id })),
      );
    } catch {
      // best-effort — leave list unchanged on failure
    } finally {
      setSettingDefaultId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteAddress(id);
      setAddresses((prev) => (prev ?? []).filter((a) => a.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  const isFormOpen = creating || editingId !== null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{t.title}</h2>
          <p className="text-sm text-muted-foreground">{t.description}</p>
        </div>

        {!isFormOpen && (
          <Button type="button" variant="outline" onClick={startCreate}>
            <Plus className="size-4" />
            {t.add}
          </Button>
        )}
      </div>

      {addresses === null ? (
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      ) : addresses.length === 0 && !isFormOpen ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        addresses.length > 0 && (
          <ItemGroup>
            {addresses.map((address) => (
              <Item key={address.id} variant="outline">
                <ItemMedia variant="icon">
                  <MapPin />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    {address.label || t.address}
                    {address.isDefault && (
                      <Badge variant="secondary">{t.default}</Badge>
                    )}
                  </ItemTitle>
                  <ItemDescription>
                    {address.address}
                    {address.city ? `, ${address.city}` : ""}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  {!address.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={settingDefaultId === address.id}
                      onClick={() => handleSetDefault(address.id)}
                    >
                      {settingDefaultId === address.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        t.setDefault
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(address)}
                  >
                    {t.edit}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deletingId === address.id}
                        />
                      }
                    >
                      {deletingId === address.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        t.delete
                      )}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {t.deleteConfirmTitle}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.deleteConfirmDescription}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(address.id)}
                        >
                          {t.confirmDelete}
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )
      )}

      {isFormOpen && (
        <div className="flex flex-col gap-4 rounded-xl border border-border p-5 sm:max-w-sm">
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="address-label">{t.labelField}</FieldLabel>
              <Input
                id="address-label"
                placeholder={t.labelPlaceholder}
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="address-recipient-name">
                {t.recipientName}
              </FieldLabel>
              <Input
                id="address-recipient-name"
                value={form.recipientName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipientName: e.target.value }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="address-recipient-phone">
                {t.recipientPhone}
              </FieldLabel>
              <Input
                id="address-recipient-phone"
                type="tel"
                placeholder="+243900000000"
                value={form.recipientPhone}
                onChange={(e) =>
                  setForm((f) => ({ ...f, recipientPhone: e.target.value }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="address-line">{t.address}</FieldLabel>
              <Textarea
                id="address-line"
                placeholder={t.addressPlaceholder}
                value={form.address}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: e.target.value }))
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="address-city">{t.city}</FieldLabel>
              <Input
                id="address-city"
                value={form.city}
                onChange={(e) =>
                  setForm((f) => ({ ...f, city: e.target.value }))
                }
              />
            </Field>

            <FieldDescription className="flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              {locating ? (
                <span className="flex items-center gap-1.5">
                  <Spinner className="size-3.5" />
                  {t.locating}
                </span>
              ) : coords ? (
                <span className="text-emerald-600 dark:text-emerald-400">
                  {t.locationCaptured}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {locationError ?? t.locationError}
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t.retryLocation}
                  </button>
                </span>
              )}
            </FieldDescription>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={form.isDefault}
                onCheckedChange={(checked) =>
                  setForm((f) => ({ ...f, isDefault: checked === true }))
                }
              />
              {t.makeDefault}
            </label>

            {error && (
              <FieldDescription className="text-destructive">
                {error}
              </FieldDescription>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.address.trim() || locating}
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                {t.save}
              </Button>
              <Button type="button" variant="ghost" onClick={closeForm}>
                {t.cancel}
              </Button>
            </div>
          </FieldGroup>
        </div>
      )}
    </section>
  );
}

export default ProfileAddresses;
