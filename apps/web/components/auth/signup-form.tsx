"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";

import { Input } from "@/components/ui/input";

import Logo from "../global/logo";

import {
  GoogleIcon,
  RotatingCaption,
  SIGNUP_STRINGS,
} from "@/lib/constants/auth";

import { DEFAULT_LOCALE, getClientLocale, Locale } from "@/lib/language";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocale(getClientLocale());
  }, []);

  const t = SIGNUP_STRINGS[locale];

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form>
        <FieldGroup>
          {/* Header */}
          <div className="flex flex-col gap-2 text-center">
            <div className="flex flex-col gap-2 font-medium">
              <div className="flex size-8 justify-start rounded-md">
                <Logo />
              </div>

              <span className="sr-only">SwiftGoma.</span>
            </div>

            <h1 className="mt-6 flex items-start justify-start text-4xl font-bold">
              {t.title}
            </h1>

            <FieldDescription>
              {t.alreadyHaveAccount}{" "}
              <Link
                href="/auth/sign-in"
                className="text-primary hover:underline"
              >
                {t.signIn}
              </Link>
            </FieldDescription>
          </div>

          {/* Name and email */}
          <Field>
            <FieldLabel htmlFor="name">{t.name}</FieldLabel>

            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t.namePlaceholder}
              autoComplete="name"
              required
            />

            <FieldLabel htmlFor="email">{t.email}</FieldLabel>

            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t.emailPlaceholder}
              autoComplete="email"
              required
            />
          </Field>

          {/* Submit */}
          <Field>
            <Button type="submit" className="w-full">
              {t.createAccount}
            </Button>
          </Field>

          {/* Separator */}
          <FieldSeparator>{t.or}</FieldSeparator>

          {/* Google */}
          <Button variant="outline" type="button" className="w-full">
            <GoogleIcon />

            {t.continueWithGoogle}
          </Button>
        </FieldGroup>
      </form>

      <FieldDescription className="px-6 text-center">
        <RotatingCaption locale={locale} />
      </FieldDescription>
    </div>
  );
}
