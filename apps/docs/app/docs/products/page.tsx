import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Products" };

export default function ProductsGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Products</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Browsing is public and requires no authentication. Listing and managing products
        requires a SELLER account with a shop and an active subscription. A separate set of
        staff-only endpoints handles categories, currency exchange rates, and moderation. Every
        endpoint mentioned on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/products
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Catalog structure</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Every product belongs to a subcategory, which belongs to a category. A product has one
        or more variants — even a product with no real variation (no size or color options) is
        modeled as a single default variant, which is what actually carries the price and
        stock.
      </p>
      <InfoTable
        columns={["Level", "Examples", "Managed by"]}
        rows={[
          ["Category", "Alimentation & Boissons, Électronique", "Staff"],
          ["Subcategory", "Boissons, Téléphones & tablettes", "Staff"],
          ["Product", "“Riz parfumé 25kg”", "Seller"],
          ["Variant", "Price + stock (e.g. 25kg bag at $12.50, 40 in stock)", "Seller"],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Browsing the catalog</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        No authentication required. Only <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">PUBLISHED</code> products from{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">PUBLISHED</code> shops are ever returned.
      </p>
      <InfoTable
        columns={["Endpoint", "Use it for"]}
        rows={[
          [
            <Link key="a" href="/reference/list-products" className="text-primary underline underline-offset-2">
              GET /
            </Link>,
            "Search and filter — category, subcategory, shop, price range, currency, city, in-stock only, free-text search, and sorting (recent, popular, price asc/desc).",
          ],
          [
            <Link key="b" href="/reference/list-popular-products" className="text-primary underline underline-offset-2">
              GET /popular
            </Link>,
            "A shortcut for sortBy=popular — ranked by a rolling 30-day blend of sales, favorites, views, and reviews.",
          ],
          [
            <Link key="c" href="/reference/get-product-by-slug" className="text-primary underline underline-offset-2">
              GET /slug/:slug
            </Link>,
            "Full product detail — images, variants, rating summary, recent reviews, purchase count.",
          ],
        ]}
      />
      <Callout variant="note">
        List and popular results are cached for 2 minutes per unique filter combination.
        Product detail by slug is cached for 5 minutes.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Multi-currency pricing</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Every product is priced in a single currency — USD or CDF — set at creation and fixed
        after that. Cross-currency conversion for display purposes runs off staff-managed
        exchange rates rather than a live market feed.
      </p>
      <Callout variant="tip">
        <Link href="/reference/preview-conversion" className="text-primary underline underline-offset-2">
          POST /exchange-rates/preview
        </Link>{" "}
        (staff-only) converts an amount between currencies using the configured rate without
        writing anything — useful for building admin tooling around pricing.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Listing a product</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Requires a SELLER account with an existing shop and an active subscription — plan tier
        determines how many products and photos-per-product are allowed.
      </p>
      <StepList
        steps={[
          {
            title: "Create the product",
            body: (
              <>
                <Link href="/reference/create-product" className="text-primary underline underline-offset-2">
                  POST /
                </Link>{" "}
                (multipart/form-data) with the product fields, a JSON-encoded <code>variants</code> array,
                and up to 10 images. It&apos;s created as <code>DRAFT</code>.
              </>
            ),
          },
          {
            title: "Publish it",
            body: (
              <>
                <Link href="/reference/set-product-status" className="text-primary underline underline-offset-2">
                  POST /:id/status
                </Link>{" "}
                with <code>{`{ "status": "PUBLISHED" }`}</code> makes it visible in the public
                catalog.
              </>
            ),
          },
          {
            title: "Edit descriptive fields anytime",
            body: (
              <>
                <Link href="/reference/update-product" className="text-primary underline underline-offset-2">
                  PUT /:id
                </Link>{" "}
                covers name, description, brand, unit, weight, and expiry — not images, variants,
                or status.
              </>
            ),
          },
        ]}
      />

      <Callout variant="warning" title="A few validation rules to know upfront">
        Name is 2–100 characters, description 20–1000. At least one variant is required, up to
        a maximum of 50. Prices and stock have per-currency bounds. Products in the{" "}
        <em>Alimentation &amp; Boissons</em> category require a future-dated expiry — including
        on later edits, so clearing it isn&apos;t possible without also removing the product
        from that category.
      </Callout>

      <h3 className="mb-3 text-base font-semibold">Product status lifecycle</h3>
      <InfoTable
        columns={["From", "Can move to"]}
        rows={[
          ["DRAFT", "PUBLISHED"],
          ["PUBLISHED", "ARCHIVED, DRAFT"],
          ["ARCHIVED", "DRAFT"],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Managing inventory</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Stock is adjusted with a signed delta rather than set to an absolute value, and every
        change is logged.
      </p>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "Adjust stock",
            <Link key="a" href="/reference/adjust-stock" className="text-primary underline underline-offset-2">
              POST /variants/:variantId/stock
            </Link>,
          ],
          [
            "View movement history",
            <Link key="b" href="/reference/stock-history" className="text-primary underline underline-offset-2">
              GET /variants/:variantId/stock/history
            </Link>,
          ],
        ]}
      />
      <Callout variant="note">
        A negative <code>amount</code> that would take stock below zero is rejected atomically
        — concurrent adjustments on the same variant can&apos;t race each other into a negative
        balance.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Reviews</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Any signed-in buyer who has actually received a product (order status{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">DELIVERED</code> or{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">COMPLETED</code>) can leave a
        1–5 star rating with a comment via{" "}
        <Link href="/reference/submit-review" className="text-primary underline underline-offset-2">
          POST /:productId/reviews
        </Link>
        . One review per buyer per product — submitting again replaces the previous one rather
        than adding a second.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Categories &amp; exchange rates</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Both are staff-managed (ADMIN or SUPPORT) — full CRUD lives in the reference under{" "}
        <Link href="/reference/list-categories" className="text-primary underline underline-offset-2">
          Categories
        </Link>{" "}
        and{" "}
        <Link href="/reference/list-exchange-rates" className="text-primary underline underline-offset-2">
          Exchange Rates
        </Link>
        . A category can&apos;t be deleted while it still has subcategories, and a subcategory
        can&apos;t be deleted while products are still attached to it.
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Moderation</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Staff can browse every product on the platform and take one down, regardless of shop or
        current status.
      </p>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "List all products",
            <Link key="a" href="/reference/admin-list-products" className="text-primary underline underline-offset-2">
              GET /admin
            </Link>,
          ],
          [
            "Get any product's detail",
            <Link key="b" href="/reference/admin-get-product" className="text-primary underline underline-offset-2">
              GET /admin/:id
            </Link>,
          ],
          [
            "Draft or archive a product",
            <Link key="c" href="/reference/admin-set-product-status" className="text-primary underline underline-offset-2">
              POST /admin/:id/status
            </Link>,
          ],
        ]}
      />
      <Callout variant="note" title="Moderation can only take products down">
        The staff status endpoint only accepts <code>DRAFT</code> or <code>ARCHIVED</code> — it
        deliberately can&apos;t set a product to <code>PUBLISHED</code>, so staff can moderate a
        listing but can never publish on a seller&apos;s behalf.
      </Callout>

      <Link
        href="/reference/list-products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Products endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
