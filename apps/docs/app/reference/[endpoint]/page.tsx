import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allEndpoints, getEndpointBySlug } from "@/lib/combined-endpoints";
import { EndpointPage } from "@/components/endpoint-page";

export function generateStaticParams() {
  return allEndpoints.map((e) => ({ endpoint: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ endpoint: string }>;
}): Promise<Metadata> {
  const { endpoint: slug } = await params;
  const endpoint = getEndpointBySlug(slug);
  return { title: endpoint?.title ?? "Not found" };
}

export default async function ReferenceEndpointRoute({
  params,
}: {
  params: Promise<{ endpoint: string }>;
}) {
  const { endpoint: slug } = await params;
  const endpoint = getEndpointBySlug(slug);
  if (!endpoint) notFound();

  return <EndpointPage endpoint={endpoint} />;
}
