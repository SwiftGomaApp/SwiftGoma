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
        tokens. Accounts can sign in with a password, a one-time email code, a passkey, or
        Google — and can optionally add TOTP-based two-factor authentication on top of any of
        them. Every endpoint mentioned on this page lives under{" "}
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
        All four methods converge on the same result — a session for web, or a token pair for
        mobile — and all four can be intercepted by a two-factor challenge if the account has
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
            <>Set a first password <span className="text-xs">(Google/passkey-only accounts)</span></>,
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
            "login/password, login/verify-otp, password/reset, totp confirm/disable",
            "Tightest limits, scoped by IP and by account. Repeated failures feed automatic IP blocking.",
          ],
          [
            "Request / initiation",
            "login/request-otp, password/forgot, resend-verification",
            "Limited per IP and per account, with a resend cooldown, to prevent inbox or SMS flooding.",
          ],
          [
            "Account creation",
            "create-account, register/google, login/google",
            "Tightly limited per IP, and screened for automated traffic before hitting the limiter.",
          ],
          [
            "Session",
            "me, logout, sessions, refresh-token",
            "Looser limits — these don't touch credentials.",
          ],
          [
            "Authenticated action",
            "totp/setup, passkey registration, password/create",
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
