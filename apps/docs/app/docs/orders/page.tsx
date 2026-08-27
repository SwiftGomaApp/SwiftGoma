import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Orders</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        An order moves through buyer, seller, and — for deliveries — rider hands before it&apos;s
        done. Every endpoint on this page requires authentication, and lives under either{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/cart
        </code>{" "}
        or{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/orders
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Cart → checkout</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A buyer has one cart per shop, capped at 50 line items. Checkout turns one shop&apos;s cart
        into an order and starts payment — it doesn&apos;t touch any of the buyer&apos;s other carts.
      </p>
      <StepList
        steps={[
          {
            title: "Build the cart",
            body: (
              <>
                <Link href="/reference/add-cart-item" className="text-primary underline underline-offset-2">
                  POST /cart/items
                </Link>{" "}
                to add, <Link href="/reference/update-cart-item" className="text-primary underline underline-offset-2">PUT /cart/items/:itemId</Link> to
                change quantity, <Link href="/reference/remove-cart-item" className="text-primary underline underline-offset-2">DELETE /cart/items/:itemId</Link> to
                remove.
              </>
            ),
          },
          {
            title: "Check out",
            body: (
              <>
                <Link href="/reference/checkout" className="text-primary underline underline-offset-2">
                  POST /orders/checkout
                </Link>{" "}
                with the shopId, fulfillment method, and mobile money payment details. The order
                is created as <code>AWAITING_PAYMENT</code>.
              </>
            ),
          },
        ]}
      />
      <Callout variant="tip">
        Send an <code>Idempotency-Key</code> header on checkout — a retried request with the
        same key returns the original order instead of charging the buyer twice.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Order status lifecycle</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Status only ever moves forward through this graph — there&apos;s no going back a step.
      </p>
      <InfoTable
        columns={["Status", "Can move to"]}
        rows={[
          ["AWAITING_PAYMENT", "PENDING_SELLER_REVIEW, FAILED, CANCELLED"],
          ["PENDING_SELLER_REVIEW", "ACCEPTED, REJECTED, CANCELLED, EXPIRED"],
          ["ACCEPTED", "PREPARING, READY_FOR_PICKUP, RIDER_ASSIGNED, CANCELLED"],
          ["PREPARING", "READY_FOR_PICKUP, RIDER_ASSIGNED, CANCELLED"],
          ["READY_FOR_PICKUP", "COMPLETED, CANCELLED"],
          ["RIDER_ASSIGNED", "PICKED_UP, CANCELLED, ACCEPTED"],
          ["PICKED_UP", "ON_THE_WAY, FAILED"],
          ["ON_THE_WAY", "DELIVERED, FAILED"],
          ["DELIVERED", "COMPLETED"],
          ["COMPLETED / REJECTED / CANCELLED / EXPIRED / FAILED", "— terminal"],
        ]}
      />
      <Callout variant="note" title="PICKUP vs DELIVERY diverge after ACCEPTED">
        A pickup order goes ACCEPTED → PREPARING → READY_FOR_PICKUP → COMPLETED. A delivery
        order goes ACCEPTED → PREPARING → RIDER_ASSIGNED → PICKED_UP → ON_THE_WAY → DELIVERED →
        COMPLETED. Which path applies is fixed by the order&apos;s <code>fulfillmentMethod</code>.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Who does what</h2>
      <InfoTable
        columns={["Role", "Moves the order through"]}
        rows={[
          [
            "Buyer",
            <>
              <Link key="a" href="/reference/checkout" className="text-primary underline underline-offset-2">checkout</Link>
              {" · "}
              <Link key="b" href="/reference/cancel-order" className="text-primary underline underline-offset-2">cancel</Link>
              {" · "}
              <Link key="c" href="/reference/confirm-receipt" className="text-primary underline underline-offset-2">confirm receipt</Link>
            </>,
          ],
          [
            "Seller",
            <>
              <Link key="a" href="/reference/accept-order" className="text-primary underline underline-offset-2">accept</Link>
              {" · "}
              <Link key="b" href="/reference/reject-order" className="text-primary underline underline-offset-2">reject</Link>
              {" · "}
              <Link key="c" href="/reference/mark-order-ready" className="text-primary underline underline-offset-2">mark ready</Link>
              {" · "}
              <Link key="d" href="/reference/complete-pickup" className="text-primary underline underline-offset-2">complete pickup</Link>
              {" · "}
              <Link key="e" href="/reference/assign-rider" className="text-primary underline underline-offset-2">assign rider</Link>
            </>,
          ],
          [
            "Rider",
            <>
              <Link key="a" href="/reference/mark-picked-up" className="text-primary underline underline-offset-2">picked up</Link>
              {" · "}
              <Link key="b" href="/reference/mark-on-the-way" className="text-primary underline underline-offset-2">on the way</Link>
              {" · "}
              <Link key="c" href="/reference/complete-delivery" className="text-primary underline underline-offset-2">complete delivery</Link>
              {" · "}
              <Link key="d" href="/reference/mark-failed-delivery" className="text-primary underline underline-offset-2">failed delivery</Link>
            </>,
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">QR-code handoffs</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Both handoff points — a buyer collecting a pickup order, or a rider delivering one —
        are confirmed the same way: the buyer shows a QR code, the other party scans it.
      </p>
      <StepList
        steps={[
          {
            title: "Buyer generates the code",
            body: (
              <>
                <Link href="/reference/get-order-qr" className="text-primary underline underline-offset-2">
                  GET /:id/qr-code
                </Link>{" "}
                returns a single-use <code>qrToken</code>.
              </>
            ),
          },
          {
            title: "Seller or rider scans it",
            body: (
              <>
                <Link href="/reference/scan-order-qr" className="text-primary underline underline-offset-2">
                  POST /scan
                </Link>{" "}
                resolves the token to the order — this is what a scanning app calls right after
                reading the code.
              </>
            ),
          },
          {
            title: "Confirm the handoff",
            body: (
              <>
                The seller calls{" "}
                <Link href="/reference/complete-pickup" className="text-primary underline underline-offset-2">
                  POST /:id/complete-pickup
                </Link>
                , or the rider calls{" "}
                <Link href="/reference/complete-delivery" className="text-primary underline underline-offset-2">
                  POST /:id/complete-delivery
                </Link>
                , passing the same <code>qrToken</code>.
              </>
            ),
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">In-delivery chat</h2>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Buyer and rider can message each other through{" "}
        <Link href="/reference/list-order-messages" className="text-primary underline underline-offset-2">
          GET /:id/messages
        </Link>
        ,{" "}
        <Link href="/reference/send-order-message" className="text-primary underline underline-offset-2">
          POST /:id/messages
        </Link>{" "}
        (up to 1000 characters, capped at 20 per minute), and{" "}
        <Link href="/reference/mark-order-messages-read" className="text-primary underline underline-offset-2">
          POST /:id/messages/read
        </Link>
        — but only while the order is actively out for delivery.
      </p>
      <Callout variant="warning" title="The thread isn't open the whole time">
        Sending a message only works while the order is <code>RIDER_ASSIGNED</code>,{" "}
        <code>PICKED_UP</code>, or <code>ON_THE_WAY</code>. Before a rider is assigned, or after
        delivery, <code>POST /:id/messages</code> is rejected.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Cancellation &amp; refunds</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A buyer can cancel their own order via{" "}
        <Link href="/reference/cancel-order" className="text-primary underline underline-offset-2">
          POST /:id/cancel
        </Link>{" "}
        while it&apos;s still in an early-enough status — AWAITING_PAYMENT, PENDING_SELLER_REVIEW,
        ACCEPTED, PREPARING, READY_FOR_PICKUP, or RIDER_ASSIGNED. Once a rider has picked up the
        order, it can no longer be cancelled that way.
      </p>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Staff have three refund-related endpoints, under the Order Moderation group:
      </p>
      <InfoTable
        columns={["Endpoint", "Role", "Notes"]}
        rows={[
          [
            <Link key="a" href="/reference/admin-cancel-order" className="text-primary underline underline-offset-2">
              POST /admin/:id/cancel
            </Link>,
            "ADMIN, SUPPORT",
            "Cancels on the buyer's behalf, e.g. for a support case.",
          ],
          [
            <>
              <Link key="b1" href="/reference/admin-request-order-refund-approval" className="text-primary underline underline-offset-2">
                POST /admin/:id/refund/request-approval
              </Link>
              {" → "}
              <Link key="b2" href="/reference/admin-confirm-order-refund" className="text-primary underline underline-offset-2">
                confirm
              </Link>
            </>,
            "ADMIN",
            "OTP-gated — emails a code, then requires it to complete the refund.",
          ],
          [
            <Link key="c" href="/reference/admin-refund-order" className="text-primary underline underline-offset-2">
              POST /admin/:id/refund
            </Link>,
            "ADMIN",
            "Issues the refund directly, without the OTP step.",
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Timeouts to plan around</h2>
      <InfoTable
        columns={["Window", "Duration"]}
        rows={[
          ["Seller must accept or reject a new order", "120 minutes, then it expires"],
          ["Rider must act on an assigned order", "240 minutes"],
          ["Buyer confirms receipt after delivery", "Auto-completes after 48 hours if they don't"],
        ]}
      />

      <Link
        href="/reference/checkout"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Orders endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
