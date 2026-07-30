import type { AxiosResponse } from "axios";

interface SuccessEnvelope<T> {
  success: true;
  data: T;
}

export function unwrap<T>(response: AxiosResponse<SuccessEnvelope<T>>): T {
  return response.data.data;
}

export interface Paginated {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function toQueryString(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const usable = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== null && value !== "",
  );
  if (usable.length === 0) return "";
  const search = new URLSearchParams(
    usable.map(([key, value]) => [key, String(value)]),
  );
  return `?${search.toString()}`;
}
