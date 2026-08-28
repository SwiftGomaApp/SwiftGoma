import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Users" };

export default function UsersGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Users</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        Once a user is signed in (see{" "}
        <Link href="/docs/authentication" className="text-primary underline underline-offset-2">
          Authentication
        </Link>
        ), these endpoints manage their profile, contact details, linked sign-in methods, and
        account lifecycle. A separate set of staff-only endpoints lets Admin and Support
        accounts look up, moderate, and manage other users. Every endpoint mentioned on this
        page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/users
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Self-service vs. staff-only</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Every endpoint on this page falls into one of two buckets:
      </p>
      <InfoTable
        columns={["Bucket", "Acts on", "Requires"]}
        rows={[
          [
            "Self-service",
            "The signed-in user's own account",
            "Any valid session",
          ],
          [
            "Admin",
            "A target user, by userId, given in the path",
            "ADMIN or SUPPORT role — some actions ADMIN only",
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Roles</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Every account has exactly one role, which governs both what that account can do across
        the whole API and, here, who can act on other users.
      </p>
      <InfoTable
        columns={["Role", "Who"]}
        rows={[
          ["BUYER", "Default role — shops and orders on the platform."],
          ["SELLER", "Runs a shop, once seller onboarding and KYC are complete."],
          ["RIDER", "Delivers orders."],
          ["SUPPORT", "Staff — can moderate users but not delete accounts or change roles."],
          ["ADMIN", "Staff — full access, including account deletion and role changes."],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Profile</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A user&apos;s display name, preferred currency, and profile picture are the only
        self-describing fields they control directly.
      </p>
      <InfoTable
        columns={["Field", "Endpoint"]}
        rows={[
          [
            "Name / preferred currency",
            <Link key="a" href="/reference/update-profile" className="text-primary underline underline-offset-2">
              PATCH /profile
            </Link>,
          ],
          [
            "Profile picture",
            <Link key="b" href="/reference/upload-avatar" className="text-primary underline underline-offset-2">
              POST /profile/avatar
            </Link>,
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Contact methods</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Phone number and a secondary email both follow the same shape: request a code, then
        verify it. That two-step pattern shows up everywhere in this API — get comfortable with
        it once and it applies broadly.
      </p>

      <h3 className="mb-3 text-base font-semibold">Phone number</h3>
      <StepList
        steps={[
          {
            title: "Adding a first number",
            body: (
              <>
                <Link href="/reference/phone-request" className="text-primary underline underline-offset-2">
                  POST /phone/request
                </Link>{" "}
                sends an SMS code, then{" "}
                <Link href="/reference/phone-verify" className="text-primary underline underline-offset-2">
                  POST /phone/verify
                </Link>{" "}
                confirms it.
              </>
            ),
          },
          {
            title: "Changing an existing number",
            body: (
              <>
                Same pattern, different endpoints:{" "}
                <Link href="/reference/phone-update-request" className="text-primary underline underline-offset-2">
                  POST /phone/update/request
                </Link>{" "}
                sends the code to the <em>new</em> number,{" "}
                <Link href="/reference/phone-update-verify" className="text-primary underline underline-offset-2">
                  POST /phone/update/verify
                </Link>{" "}
                confirms and switches over.
              </>
            ),
          },
        ]}
      />

      <h3 className="mb-3 text-base font-semibold">Secondary email</h3>
      <StepList
        steps={[
          {
            title: "Add and verify",
            body: (
              <>
                <Link href="/reference/secondary-email-request" className="text-primary underline underline-offset-2">
                  POST /email/secondary/request
                </Link>{" "}
                emails a code to the new address,{" "}
                <Link href="/reference/secondary-email-verify" className="text-primary underline underline-offset-2">
                  POST /email/secondary/verify
                </Link>{" "}
                confirms it.
              </>
            ),
          },
          {
            title: "Remove it",
            body: (
              <>
                <Link href="/reference/secondary-email-delete" className="text-primary underline underline-offset-2">
                  DELETE /email/secondary
                </Link>{" "}
                — no code required, since it&apos;s just removing a contact point, not adding one.
              </>
            ),
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Linked sign-in methods</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A Google or Apple account can be linked to or unlinked from an existing SwiftGoma
        account at any time via{" "}
        <Link href="/reference/google-link" className="text-primary underline underline-offset-2">
          POST /google/link
        </Link>{" "}
        /{" "}
        <Link href="/reference/google-unlink" className="text-primary underline underline-offset-2">
          POST /google/unlink
        </Link>{" "}
        and{" "}
        <Link href="/reference/apple-link" className="text-primary underline underline-offset-2">
          POST /apple/link
        </Link>{" "}
        /{" "}
        <Link href="/reference/apple-unlink" className="text-primary underline underline-offset-2">
          POST /apple/unlink
        </Link>
        .
      </p>
      <Callout variant="warning" title="Don&apos;t lock the user out">
        Unlinking Google or Apple fails if it&apos;s the account&apos;s only sign-in method — the
        user needs a password set first (see{" "}
        <Link href="/reference/password-create" className="text-primary underline underline-offset-2">
          POST /password/create
        </Link>{" "}
        in the Authentication guide) so they always have at least one way to sign back in.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Account deletion and recovery</h2>
      <StepList
        steps={[
          {
            title: "Delete",
            body: (
              <>
                <Link href="/reference/delete-account" className="text-primary underline underline-offset-2">
                  POST /delete
                </Link>{" "}
                doesn&apos;t erase the account immediately. It&apos;s marked deleted, every session
                is revoked, and a grace period starts.
              </>
            ),
          },
          {
            title: "Recover, within the grace period",
            body: (
              <>
                <Link href="/reference/recovery-request" className="text-primary underline underline-offset-2">
                  POST /recovery/request
                </Link>{" "}
                sends a code by email, and{" "}
                <Link href="/reference/recovery-verify" className="text-primary underline underline-offset-2">
                  POST /recovery/verify
                </Link>{" "}
                restores the account and signs the user back in — both endpoints are
                unauthenticated, since by definition the user has no valid session at this
                point.
              </>
            ),
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Admin operations</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Staff-only endpoints for looking up and moderating any user on the platform. Every one
        of these takes the target <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">userId</code> in the path.
      </p>
      <InfoTable
        columns={["Action", "Endpoint", "Role"]}
        rows={[
          [
            "List / search users",
            <Link key="a" href="/reference/admin-list-users" className="text-primary underline underline-offset-2">
              GET /
            </Link>,
            "ADMIN, SUPPORT",
          ],
          [
            "Get one user's detail",
            <Link key="b" href="/reference/admin-get-user" className="text-primary underline underline-offset-2">
              GET /:id
            </Link>,
            "ADMIN, SUPPORT",
          ],
          [
            "Block / unblock",
            <>
              <Link key="c1" href="/reference/admin-block-user" className="text-primary underline underline-offset-2">
                POST /:id/block
              </Link>
              {" · "}
              <Link key="c2" href="/reference/admin-unblock-user" className="text-primary underline underline-offset-2">
                unblock
              </Link>
            </>,
            "ADMIN, SUPPORT",
          ],
          [
            "Force logout",
            <Link key="d" href="/reference/admin-force-logout" className="text-primary underline underline-offset-2">
              POST /:id/force-logout
            </Link>,
            "ADMIN, SUPPORT",
          ],
          [
            "Manually verify email / phone",
            <>
              <Link key="e1" href="/reference/admin-verify-email" className="text-primary underline underline-offset-2">
                POST /:id/verify-email
              </Link>
              {" · "}
              <Link key="e2" href="/reference/admin-verify-phone" className="text-primary underline underline-offset-2">
                verify-phone
              </Link>
            </>,
            "ADMIN, SUPPORT",
          ],
          [
            "Delete / restore",
            <>
              <Link key="f1" href="/reference/admin-delete-user" className="text-primary underline underline-offset-2">
                POST /:id/delete
              </Link>
              {" · "}
              <Link key="f2" href="/reference/admin-restore-user" className="text-primary underline underline-offset-2">
                restore
              </Link>
            </>,
            "ADMIN only",
          ],
          [
            "Change role",
            <Link key="g" href="/reference/admin-change-role" className="text-primary underline underline-offset-2">
              POST /:id/role
            </Link>,
            "ADMIN only",
          ],
        ]}
      />
      <Callout variant="note" title="Why the ADMIN / SUPPORT split?">
        Support can handle day-to-day moderation — blocking a bad actor, forcing a logout,
        manually verifying a contact method during a support call. Deleting an account or
        changing what role it holds is scoped to ADMIN only, since both are harder to reverse
        and carry more risk if misused.
      </Callout>

      <Link
        href="/reference/update-profile"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Users endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
