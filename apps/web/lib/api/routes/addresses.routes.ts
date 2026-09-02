import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";

export const ADDRESS_ROUTES = {
  list: "/addresses",
  create: "/addresses",
  update: (id: string) => `/addresses/${id}`,
  remove: (id: string) => `/addresses/${id}`,
  setDefault: (id: string) => `/addresses/${id}/default`,
} as const;

export interface Address {
  id: string;
  label: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressInput {
  label?: string;
  recipientName?: string;
  recipientPhone?: string;
  address: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export function listAddresses() {
  return apiGet<Address[]>(ADDRESS_ROUTES.list);
}

export function createAddress(body: AddressInput) {
  return apiPost<Address>(ADDRESS_ROUTES.create, body);
}

export function updateAddress(id: string, body: Partial<AddressInput>) {
  return apiPatch<Address>(ADDRESS_ROUTES.update(id), body);
}

export function deleteAddress(id: string) {
  return apiDelete<{ id: string; removed: boolean }>(ADDRESS_ROUTES.remove(id));
}

export function setDefaultAddress(id: string) {
  return apiPost<Address>(ADDRESS_ROUTES.setDefault(id));
}
