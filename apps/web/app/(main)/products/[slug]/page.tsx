import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { publicApi } from "@/lib/api/routes/public";
import { ApiException } from "@/lib/api";
import { ProductDetail } from "@/components/products/product-detail";
import { SimilarProductsCarousel } from "@/components/products/similar-products-carousel";
import { SellerCard } from "@/components/products/seller-card";
import { ProductTrustInfo } from "@/components/products/product-trust-info";
import { RecentlyViewed } from "@/components/products/recently-viewed";
import { ServerErrorBanner } from "@/components/global/server-error-banner";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const product = await publicApi.getProductBySlug(slug);
    const image = product.images[0]?.url;

    return {
      title: product.name,
      description: product.description.slice(0, 160),
      openGraph: {
        title: product.name,
        description: product.description.slice(0, 160),
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    return { title: "Produit" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await publicApi.getProductBySlug(slug);
  } catch (err) {
    if (err instanceof ApiException) {
      if (err.isNetworkError) {
        return (
          <div className="mx-auto max-w-7xl px-6 py-10">
            <ServerErrorBanner />
          </div>
        );
      }
      if (err.statusCode === 404) {
        notFound();
      }
    }
    throw err;
  }

  let similarProducts: Awaited<
    ReturnType<typeof publicApi.listProducts>
  >["products"] = [];
  try {
    const result = await publicApi.listProducts({
      subcategoryId: product.subcategory.id,
      limit: 10,
    });
    similarProducts = result.products.filter((p) => p.id !== product.id);
  } catch {
    // non-critical
  }

  let shopProducts: Awaited<ReturnType<typeof publicApi.listProducts>> | null =
    null;
  try {
    shopProducts = await publicApi.listProducts({
      shopId: product.shop.id,
      limit: 10,
    });
  } catch {
    // non-critical
  }
  const moreFromShop =
    shopProducts?.products.filter((p) => p.id !== product.id) ?? [];
  const shopProductCount = shopProducts?.pagination.total ?? 1;

  const defaultVariant =
    product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const anyInStock = product.variants.some((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : undefined,
    offers: {
      "@type": "Offer",
      price: defaultVariant?.price,
      priceCurrency: product.currency,
      availability: anyInStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Accueil
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/products?categoryId=${product.subcategory.category.id}`}
          className="hover:text-foreground"
        >
          {product.subcategory.category.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link
          href={`/products?categoryId=${product.subcategory.category.id}&subcategoryId=${product.subcategory.id}`}
          className="hover:text-foreground"
        >
          {product.subcategory.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 xl:grid-cols-[1fr_280px]">
        <ProductDetail product={product} />

        {/* Sidebar: seller + trust info */}
        <div className="flex flex-col gap-4 xl:order-last">
          <SellerCard
            shopName={product.shop.name}
            shopSlug={product.shop.slug}
            productCount={shopProductCount}
          />
          <ProductTrustInfo />
        </div>
      </div>

      {moreFromShop.length > 0 && (
        <div className="mt-16">
          <SimilarProductsCarousel
            products={moreFromShop}
            title={`Plus de ${product.shop.name}`}
          />
        </div>
      )}

      {similarProducts.length > 0 && (
        <div className="mt-16">
          <SimilarProductsCarousel products={similarProducts} />
        </div>
      )}

      {product.images[0] && (
        <div className="mt-16">
          <RecentlyViewed
            currentProduct={{
              slug: product.slug,
              name: product.name,
              image: product.images[0].url,
              price: Number(defaultVariant?.price ?? 0),
              currency: product.currency,
              cart: defaultVariant
                ? {
                    shopId: product.shop.id,
                    productId: product.id,
                    variantId: defaultVariant.id,
                    price: String(defaultVariant.price),
                    stock: defaultVariant.stock,
                  }
                : undefined,
            }}
          />
        </div>
      )}
    </div>
  );
}
