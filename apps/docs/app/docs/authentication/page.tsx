import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CodeBlock } from "@/components/code-block";
import { Callout } from "@/components/callout";
import { StepList } from "@/components/step-list";
import { InfoTable } from "@/components/info-table";

export const metadata: Metadata = { title: "Authentication" };

const cookieVsMobile = `// Web (browser)
// Access & refresh tokens are set as httpOnly cookies automatically.
// Just send credentials on every request:
fetch(url, { credentials: "include" });

// Mobile
// Send this header on every request, and manage the tokens yourself:
fetch(url, { headers: { "x-client-type": "mobile" } });`;

const totpResponse = `{
  "success": true,
  "data": {
    "requiresTotp": true,
    "pendingToken": "mfa_9f8e7d6c5b4a3210"
  }
}`;

export default function AuthenticationGuidePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 lg:px-10">
      <p className="mb-2 text-sm font-medium text-primary">Guide</p>
      <h1 className="mb-4 text-3xl font-semibold tracking-tight">Authentication</h1>
      <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
        The SwiftGoma API uses short-lived access tokens paired with longer-lived refresh
        tokens. Accounts can sign in with a password, a one-time email code, a passkey,
        Google, or Apple — and can optionally add TOTP-based two-factor authentication on
        top of any of them. Every endpoint mentioned on this page lives under{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
          https://api.swiftgoma.com/api/v1/auth
        </code>
        .
      </p>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Access and refresh tokens</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A successful sign-in produces two tokens. The <strong className="font-medium text-foreground">access token</strong> is
        short-lived and sent with every authenticated request. The{" "}
        <strong className="font-medium text-foreground">refresh token</strong> lives much
        longer and is only used to obtain a new access token via{" "}
        <Link href="/reference/refresh-token" className="text-primary underline underline-offset-2">
          POST /refresh-token
        </Link>{" "}
        once the access token expires. Neither token is ever returned in a way your client
        needs to parse manually on web — see below.
      </p>
      <Callout variant="note" title="Refresh tokens rotate, with a grace period">
        Every call to <code>POST /refresh-token</code> issues a brand-new refresh token and
        retires the one that was used. The just-retired token stays valid for a short grace
        window (30 seconds), so a race between two near-simultaneous requests — two open tabs,
        a retried request — succeeds instead of failing. A token reused <em>outside</em> that
        window is treated as a genuine replay and revokes the whole session immediately.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Web vs. mobile sessions</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Browser and mobile clients receive their tokens differently, and every login and
        session endpoint behaves accordingly based on one header:
      </p>
      <div className="mb-6">
        <CodeBlock code={cookieVsMobile} language="text" />
      </div>
      <Callout variant="note" title="Why the difference?">
        Browsers can store httpOnly cookies safely and send them automatically, which also
        protects the tokens from being read by client-side JavaScript. Mobile apps have no
        cookie jar shared with a browser, so they receive the tokens directly in the response
        body and are responsible for storing them securely (e.g. Keychain / Keystore).
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Ways to sign in</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        All six methods converge on the same result — a session for web, or a token pair for
        mobile — and all six can be intercepted by a two-factor challenge if the account has
        TOTP enabled.
      </p>
      <InfoTable
        columns={["Method", "Starts with", "Finishes with"]}
        rows={[
          [
            "Password",
            <code key="a">no request needed</code>,
            <Link key="a2" href="/reference/login-password" className="text-primary underline underline-offset-2">
              POST /login/password
            </Link>,
          ],
          [
            "Passwordless email code",
            <Link key="b" href="/reference/login-request-otp" className="text-primary underline underline-offset-2">
              POST /login/request-otp
            </Link>,
            <Link key="b2" href="/reference/login-verify-otp" className="text-primary underline underline-offset-2">
              POST /login/verify-otp
            </Link>,
          ],
          [
            "Passwordless SMS code",
            <Link key="f" href="/reference/login-request-otp-sms" className="text-primary underline underline-offset-2">
              POST /login/request-otp-sms
            </Link>,
            <Link key="f2" href="/reference/login-verify-otp-sms" className="text-primary underline underline-offset-2">
              POST /login/verify-otp-sms
            </Link>,
          ],
          [
            "Passkey (WebAuthn)",
            <Link key="c" href="/reference/passkey-login-options" className="text-primary underline underline-offset-2">
              POST /passkey/login/options
            </Link>,
            <Link key="c2" href="/reference/passkey-login-verify" className="text-primary underline underline-offset-2">
              POST /passkey/login/verify
            </Link>,
          ],
          [
            "Google",
            <code key="d">Google ID token from client SDK</code>,
            <Link key="d2" href="/reference/login-google" className="text-primary underline underline-offset-2">
              POST /login/google
            </Link>,
          ],
          [
            "Apple",
            <code key="e">Apple identity token from client SDK</code>,
            <Link key="e2" href="/reference/login-apple" className="text-primary underline underline-offset-2">
              POST /login/apple
            </Link>,
          ],
        ]}
      />

      <h3 className="mb-3 text-base font-semibold">Password login</h3>
      <StepList
        steps={[
          {
            title: "Send email and password",
            body: (
              <>
                <code>POST /login/password</code> with <code>email</code> and <code>password</code>.
              </>
            ),
          },
          {
            title: "Handle the result",
            body: "If the account doesn't have 2FA enabled, you get a session immediately. If it does, you get a pendingToken instead — see Two-factor authentication below.",
          },
        ]}
      />

      <h3 className="mb-3 text-base font-semibold">Passwordless email code</h3>
      <StepList
        steps={[
          {
            title: "Request a code",
            body: (
              <>
                <code>POST /login/request-otp</code> with just the <code>email</code>. The
                response is identical whether or not the address is registered, so this step
                never reveals account existence.
              </>
            ),
          },
          {
            title: "Verify the code",
            body: (
              <>
                The user receives a code by email. Submit it to{" "}
                <code>POST /login/verify-otp</code> along with the <code>email</code>.
              </>
            ),
          },
        ]}
      />

      <h3 className="mb-3 text-base font-semibold">Passwordless SMS code</h3>
      <StepList
        steps={[
          {
            title: "Request a code",
            body: (
              <>
                <code>POST /login/request-otp-sms</code> with the <code>phone</code> number.
                Requires the account to already have a <em>verified</em> phone number — the
                response is identical whether or not the number is registered.
              </>
            ),
          },
          {
            title: "Verify the code",
            body: (
              <>
                The user receives a code by SMS. Submit it to{" "}
                <code>POST /login/verify-otp-sms</code> along with the <code>phone</code>.
              </>
            ),
          },
        ]}
      />
      <Callout variant="note">
        This uses a dedicated OTP field on the account, separate from the email login code, so
        requesting one channel&apos;s code never invalidates an in-flight request on the other.
      </Callout>

      <h3 className="mb-3 text-base font-semibold">Passkey</h3>
      <StepList
        steps={[
          {
            title: "Get a challenge",
            body: (
              <>
                <code>POST /passkey/login/options</code> with the <code>email</code> returns a
                WebAuthn assertion challenge and a <code>challengeId</code>.
              </>
            ),
          },
          {
            title: "Resolve it with the browser",
            body: (
              <>
                Pass the challenge to <code>navigator.credentials.get()</code> in the browser.
              </>
            ),
          },
          {
            title: "Verify the assertion",
            body: (
              <>
                Send the browser&apos;s response and the <code>challengeId</code> to{" "}
                <code>POST /passkey/login/verify</code>.
              </>
            ),
          },
        ]}
      />

      <h3 className="mb-3 text-base font-semibold">Registering a passkey</h3>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Adding a passkey requires an existing session — it&apos;s an account-settings action, not
        a sign-in method on its own.
      </p>
      <StepList
        steps={[
          {
            title: "Get a challenge",
            body: (
              <>
                <code>POST /passkey/register/options</code> (authenticated) returns a WebAuthn
                attestation challenge.
              </>
            ),
          },
          {
            title: "Resolve it with the browser",
            body: (
              <>
                Pass the challenge to <code>navigator.credentials.create()</code>.
              </>
            ),
          },
          {
            title: "Verify and save it",
            body: (
              <>
                Send the browser&apos;s attestation response to{" "}
                <code>POST /passkey/register/verify</code>. List existing passkeys with{" "}
                <code>GET /passkey</code>, remove one with{" "}
                <code>DELETE /passkey/:passkeyId</code>.
              </>
            ),
          },
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Two-factor authentication</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        When an account has TOTP enabled, every login method above returns this instead of a
        session:
      </p>
      <div className="mb-4">
        <CodeBlock code={totpResponse} language="json" />
      </div>
      <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
        Prompt the user for their 6-digit authenticator code (or an unused backup code), then
        finish with{" "}
        <Link href="/reference/login-totp" className="text-primary underline underline-offset-2">
          POST /login/totp
        </Link>
        , passing the <code className="rounded bg-muted px-1 py-0.5 font-mono text-[13px]">pendingToken</code>.
      </p>

      <h3 className="mb-3 text-base font-semibold">Turning it on</h3>
      <StepList
        steps={[
          {
            title: "Start setup",
            body: (
              <>
                <Link href="/reference/totp-setup" className="text-primary underline underline-offset-2">
                  POST /totp/setup
                </Link>{" "}
                (authenticated) returns a secret and a QR code to scan into an authenticator
                app.
              </>
            ),
          },
          {
            title: "Confirm it",
            body: (
              <>
                <Link href="/reference/totp-confirm" className="text-primary underline underline-offset-2">
                  POST /totp/confirm
                </Link>{" "}
                with the first 6-digit code turns 2FA on and returns a one-time set of backup
                codes — show these to the user immediately, they aren&apos;t retrievable later.
              </>
            ),
          },
        ]}
      />
      <Callout variant="tip" title="Backup codes">
        Each backup code works once, as a stand-in for a TOTP code, for the exact situations a
        user has lost their authenticator device.{" "}
        <Link href="/reference/totp-regenerate-backup-codes" className="text-primary underline underline-offset-2">
          POST /totp/regenerate-backup-codes
        </Link>{" "}
        invalidates the old set and issues a new one.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Password management</h2>
      <InfoTable
        columns={["Situation", "Endpoint"]}
        rows={[
          [
            "Forgot password",
            <>
              <Link key="a" href="/reference/password-forgot" className="text-primary underline underline-offset-2">
                POST /password/forgot
              </Link>{" "}
              then{" "}
              <Link key="a2" href="/reference/password-reset" className="text-primary underline underline-offset-2">
                POST /password/reset
              </Link>
            </>,
          ],
          [
            "Change known password",
            <Link key="b" href="/reference/password-update" className="text-primary underline underline-offset-2">
              POST /password/update
            </Link>,
          ],
          [
            <>Set a first password <span className="text-xs">(Google/Apple/passkey-only accounts)</span></>,
            <Link key="c" href="/reference/password-create" className="text-primary underline underline-offset-2">
              POST /password/create
            </Link>,
          ],
        ]}
      />
      <Callout variant="note">
        Both resetting and changing a password revoke other active sessions on the account, as
        a security precaution.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Session management</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A signed-in user can inspect and manage their own active sessions:
      </p>
      <InfoTable
        columns={["Action", "Endpoint"]}
        rows={[
          [
            "List active sessions",
            <Link key="a" href="/reference/sessions-list" className="text-primary underline underline-offset-2">
              GET /sessions
            </Link>,
          ],
          [
            "Sign out one device",
            <Link key="b" href="/reference/sessions-revoke" className="text-primary underline underline-offset-2">
              DELETE /sessions/:sessionId
            </Link>,
          ],
          [
            "Sign out everywhere",
            <Link key="c" href="/reference/logout-all" className="text-primary underline underline-offset-2">
              POST /logout-all
            </Link>,
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Account activity and security</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        <Link href="/reference/account-activity" className="text-primary underline underline-offset-2">
          GET /activity
        </Link>{" "}
        returns a durable, paginated log of security-relevant events on the account — sign-ins,
        password changes, two-factor changes, session revocations, and account-secured events —
        independent of the ephemeral in-app notification feed.
      </p>
      <Callout variant="note" title="New-device detection">
        A login only counts as &quot;new&quot; the first time a given browser/OS/device
        combination is seen for that account — comparing normalized fingerprints, not exact
        User-Agent strings, so a routine browser update doesn&apos;t look like a new device. The
        new-sign-in-detected email (and its &quot;Secure your account&quot; link) only fires for
        genuinely unrecognized devices, not on every login.
      </Callout>

      <h3 className="mb-3 text-base font-semibold">Secure my account</h3>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        A single destructive action, reachable three different ways, for a user who suspects
        their account has been compromised. It atomically revokes every session, clears the
        password, and removes any two-factor method and passkeys on the account.
      </p>
      <InfoTable
        columns={["Entry point", "Requires", "Endpoint(s)"]}
        rows={[
          [
            "In-app",
            "An active session, confirmed with an emailed code",
            <>
              <Link key="a" href="/reference/secure-account-request-otp" className="text-primary underline underline-offset-2">
                POST /secure-account/request-otp
              </Link>{" "}
              then{" "}
              <Link key="a2" href="/reference/secure-account-confirm" className="text-primary underline underline-offset-2">
                POST /secure-account/confirm
              </Link>
            </>,
          ],
          [
            "Security alert email",
            "Possession of a signed, single-use link — no session needed",
            <Link key="b" href="/reference/secure-account-confirm-link" className="text-primary underline underline-offset-2">
              POST /secure-account/confirm-link
            </Link>,
          ],
          [
            "Locked out entirely",
            "A verified phone number",
            "See Account recovery below",
          ],
        ]}
      />
      <Callout variant="tip">
        Every path funnels into the same lockdown, logs an <code>ACCOUNT_SECURED</code> entry in
        the activity feed with a <code>trigger</code> distinguishing which path was used, and
        sends a confirmation email — copied to a verified secondary email if one exists on the
        account, so the alert still reaches the owner even if the primary inbox is the thing
        that was compromised.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Locked out? Recovery by phone</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        For a user who can&apos;t sign in at all — wrong password, lost authenticator, no backup
        codes, nothing to click in an email — recovery by phone runs the exact same lockdown as
        &quot;Secure my account&quot; above, just reached without any session or working email
        link. This is a different flow from the email-based{" "}
        <Link href="/reference/recovery-request" className="text-primary underline underline-offset-2">
          account deletion recovery
        </Link>{" "}
        documented in the Users guide — this one is for a locked-out but not deleted account.
      </p>
      <StepList
        steps={[
          {
            title: "Request a code",
            body: (
              <>
                <code>POST /account-recovery/phone/request</code> with a verified{" "}
                <code>phone</code> number. Same generic response whether or not the number is
                registered.
              </>
            ),
          },
          {
            title: "Confirm it",
            body: (
              <>
                <code>POST /account-recovery/phone/confirm</code> with the SMS code. On success,
                every session is revoked, the password is cleared, and two-factor/passkeys are
                removed — the user signs in fresh afterward and sets a new password.
              </>
            ),
          },
        ]}
      />
      <Callout variant="warning">
        A soft-deleted account returns <code>NOT_FOUND</code> here rather than proceeding — that
        case belongs to the separate account-deletion recovery flow, not this one.
      </Callout>

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Rate limits</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Auth endpoints are grouped into tiers with different limits, tightest where the risk of
        abuse is highest:
      </p>
      <InfoTable
        columns={["Tier", "Applies to", "Behavior"]}
        rows={[
          [
            "Credential check",
            "login/password, login/verify-otp, login/verify-otp-sms, password/reset, totp confirm/disable, secure-account/confirm-link, account-recovery/phone/confirm",
            "Tightest limits, scoped by IP and by account. Repeated failures feed automatic IP blocking.",
          ],
          [
            "Request / initiation",
            "login/request-otp, login/request-otp-sms, password/forgot, resend-verification, account-recovery/phone/request",
            "Limited per IP and per account, with a resend cooldown, to prevent inbox or SMS flooding.",
          ],
          [
            "Account creation",
            "create-account, register/google, login/google, register/apple, login/apple",
            "Tightly limited per IP, and screened for automated traffic before hitting the limiter.",
          ],
          [
            "Session",
            "me, logout, sessions, refresh-token, activity",
            "Looser limits — these don't touch credentials.",
          ],
          [
            "Authenticated action",
            "totp/setup, passkey registration, password/create, secure-account/request-otp, secure-account/confirm",
            "Requires a valid session already; moderate limits.",
          ],
        ]}
      />

      <h2 className="mb-3 text-xl font-semibold tracking-tight">Error handling</h2>
      <p className="mb-4 text-[15px] leading-relaxed text-muted-foreground">
        Errors share one shape:
      </p>
      <div className="mb-4">
        <CodeBlock
          code={`{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Identifiants invalides."
  }
}`}
          language="json"
        />
      </div>
      <Callout variant="note" title="Enumeration-safe by design">
        <code>POST /login/request-otp</code> and <code>POST /password/forgot</code> always
        return the same generic success message, whether or not the email is registered — the
        API deliberately doesn&apos;t reveal which emails have accounts.
      </Callout>

      <Link
        href="/reference/login-password"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        Browse the Authentication endpoints in the API Reference
        <ArrowRight size={14} />
      </Link>
    </div>
  );
}
