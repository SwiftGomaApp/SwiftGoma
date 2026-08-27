export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AuthRequirement = "none" | "bearer";

export type ContentType = "application/json" | "multipart/form-data";

export interface Param {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface ErrorExample {
  status: number;
  code: string;
  message: string;
}

export interface EndpointDoc {
  slug: string;
  method: HttpMethod;
  path: string;
  title: string;
  group: string;
  auth: AuthRequirement;
  /** Role(s) required in addition to a valid session, e.g. ["ADMIN", "SUPPORT"]. */
  roles?: string[];
  rateLimit: string;
  contentType?: ContentType;
  description: string;
  pathParams?: Param[];
  queryParams?: Param[];
  bodyParams?: Param[];
  successStatus: number;
  responseExample: unknown;
  errorExamples?: ErrorExample[];
  notes?: string[];
}

export interface EndpointSection {
  slug: string;
  label: string;
  groupOrder: readonly string[];
  endpoints: EndpointDoc[];
}

export function groupBy(endpoints: EndpointDoc[], groupOrder: readonly string[]) {
  return groupOrder.map((group) => ({
    group,
    endpoints: endpoints.filter((e) => e.group === group),
  }));
}
