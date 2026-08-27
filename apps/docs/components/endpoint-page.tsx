"use client";

import { useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EndpointDoc } from "@/lib/types";
import { MethodBadge } from "@/components/method-badge";
import { ParamTable } from "@/components/param-table";
import { CodeBlock } from "@/components/code-block";

const API_HOST = "https://api.swiftgoma.com";

const PLACEHOLDER_BY_NAME: Record<string, unknown> = {
  name: "Aline Mapendo",
  email: "aline@example.com",
  code: "482913",
  password: "••••••••",
  newPassword: "NewSecurePassword123",
  currentPassword: "••••••••",
  locale: "fr",
  role: "BUYER",
  deviceName: "Chrome on macOS",
  idToken: "eyJhbGciOiJSUzI1NiIsIn...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsIn...",
  pendingToken: "mfa_9f8e7d6c5b4a3210",
  challengeId: "8f1b2c3d-4e5f-6789-a0b1-c2d3e4f56789",
  response: { id: "cred-id-base64url", rawId: "cred-id-base64url", type: "public-key" },
};

function exampleValueFor(param: { name: string; type: string }) {
  if (param.name in PLACEHOLDER_BY_NAME) return PLACEHOLDER_BY_NAME[param.name];
  if (param.type === "object") return {};
  return `<${param.name}>`;
}

function buildExampleBody(endpoint: EndpointDoc) {
  if (!endpoint.bodyParams || endpoint.bodyParams.length === 0) return null;
  const body: Record<string, unknown> = {};
  for (const param of endpoint.bodyParams) {
    body[param.name] = exampleValueFor(param);
  }
  return body;
}

function buildCurl(endpoint: EndpointDoc, body: Record<string, unknown> | null) {
  const isMultipart = endpoint.contentType === "multipart/form-data";
  const lines = [`curl --request ${endpoint.method} \\`, `  --url ${API_HOST}${endpoint.path} \\`];
  if (endpoint.auth === "bearer") {
    lines.push(`  --header 'Authorization: Bearer <access_token>' \\`);
  }

  if (isMultipart && endpoint.bodyParams) {
    endpoint.bodyParams.forEach((param, i) => {
      const isLast = i === endpoint.bodyParams!.length - 1;
      const value = param.type === "file" ? "@/path/to/file.jpg" : `<${param.name}>`;
      lines.push(`  --form '${param.name}=${value}'${isLast ? "" : " \\"}`);
    });
  } else if (body) {
    lines.push(`  --header 'Content-Type: application/json' \\`);
    lines.push(`  --data '${JSON.stringify(body, null, 2)}'`);
  } else {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/ \\$/, "");
  }
  return lines.join("\n");
}

function buildJs(endpoint: EndpointDoc, body: Record<string, unknown> | null) {
  const isMultipart = endpoint.contentType === "multipart/form-data";

  if (isMultipart && endpoint.bodyParams) {
    const formLines = endpoint.bodyParams.map((param) =>
      param.type === "file"
        ? `formData.append("${param.name}", fileInput.files[0]);`
        : `formData.append("${param.name}", "<${param.name}>");`,
    );
    const headers = endpoint.auth === "bearer" ? [`Authorization: "Bearer " + accessToken`] : [];

    return [
      `const formData = new FormData();`,
      ...formLines,
      ``,
      `const res = await fetch("${API_HOST}${endpoint.path}", {`,
      `  method: "${endpoint.method}",`,
      ...(headers.length ? [`  headers: {\n    ${headers.join(",\n    ")}\n  },`] : []),
      `  body: formData,`,
      `});`,
      ``,
      `const { data } = await res.json();`,
    ].join("\n");
  }

  const headers: string[] = [];
  if (body) headers.push(`"Content-Type": "application/json"`);
  if (endpoint.auth === "bearer") headers.push(`Authorization: "Bearer " + accessToken`);

  const optionLines = [`  method: "${endpoint.method}",`];
  if (headers.length) {
    optionLines.push(`  headers: {\n    ${headers.join(",\n    ")}\n  },`);
  }
  if (body) {
    optionLines.push(`  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, "\n  ")}),`);
  }

  return [
    `const res = await fetch("${API_HOST}${endpoint.path}", {`,
    ...optionLines,
    `});`,
    ``,
    `const { data } = await res.json();`,
  ].join("\n");
}

export function EndpointPage({ endpoint }: { endpoint: EndpointDoc }) {
  const [tab, setTab] = useState<"curl" | "js">("curl");
  const body = buildExampleBody(endpoint);
  const requestCode = tab === "curl" ? buildCurl(endpoint, body) : buildJs(endpoint, body);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-12 lg:px-10 xl:px-14">
      <div className="min-w-0">
        <p className="mb-1 text-sm font-medium text-primary">{endpoint.group}</p>
        <h1 className="mb-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {endpoint.title}
        </h1>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <MethodBadge method={endpoint.method} />
          <code className="rounded-md border border-border bg-muted px-2.5 py-1 font-mono text-sm">
            {endpoint.path}
          </code>
        </div>

        <p className="mb-6 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          {endpoint.description}
        </p>

        <div className="mb-8 flex flex-wrap gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium",
              endpoint.auth === "bearer"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground",
            )}
          >
            <Lock size={12} />
            {endpoint.auth === "bearer" ? "Requires Authorization" : "No authentication required"}
          </div>
          {endpoint.roles && endpoint.roles.length > 0 && (
            <div className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <ShieldAlert size={12} />
              {endpoint.roles.join(", ")} only
            </div>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <ShieldAlert size={12} />
            {endpoint.rateLimit}
          </div>
        </div>

        {endpoint.pathParams && endpoint.pathParams.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">Path parameters</h2>
            <ParamTable params={endpoint.pathParams} />
          </section>
        )}

        {endpoint.queryParams && endpoint.queryParams.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">Query parameters</h2>
            <ParamTable params={endpoint.queryParams} />
          </section>
        )}

        {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">
              {endpoint.contentType === "multipart/form-data" ? "Form fields" : "Body parameters"}
            </h2>
            <ParamTable params={endpoint.bodyParams} />
          </section>
        )}

        {endpoint.errorExamples && endpoint.errorExamples.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">Possible errors</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  {endpoint.errorExamples.map((err, i) => (
                    <tr
                      key={err.code}
                      className={
                        i !== endpoint.errorExamples!.length - 1
                          ? "border-b border-border"
                          : ""
                      }
                    >
                      <td className="w-28 px-4 py-3 align-top">
                        <span className="rounded bg-delete px-1.5 py-0.5 font-mono text-xs font-medium text-delete-foreground">
                          {err.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top font-mono text-xs text-muted-foreground">
                        {err.code}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {endpoint.notes && endpoint.notes.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-sm font-semibold">Notes</h2>
            <ul className="space-y-2">
              {endpoint.notes.map((note, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground"
                >
                  {note}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <div className="lg:sticky lg:top-28 lg:self-start">
        <div className="mb-3 flex items-center gap-1 rounded-lg border border-border bg-muted p-1 text-sm">
          <button
            onClick={() => setTab("curl")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition",
              tab === "curl" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            cURL
          </button>
          <button
            onClick={() => setTab("js")}
            className={cn(
              "flex-1 rounded-md px-3 py-1.5 font-medium transition",
              tab === "js" ? "bg-background shadow-sm" : "text-muted-foreground",
            )}
          >
            JavaScript
          </button>
        </div>

        <CodeBlock code={requestCode} language="text" title="Request" />

        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground">
            <span className="rounded bg-get px-1.5 py-0.5 font-mono text-get-foreground">
              {endpoint.successStatus}
            </span>
            Example response
          </div>
          <CodeBlock code={JSON.stringify(endpoint.responseExample, null, 2)} language="json" />
        </div>
      </div>
    </div>
  );
}
