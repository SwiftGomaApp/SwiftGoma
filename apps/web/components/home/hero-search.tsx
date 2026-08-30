"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HomeHeroSearch({
  placeholder,
  buttonLabel,
}: {
  placeholder: string;
  buttonLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    const qs = trimmed ? `?search=${encodeURIComponent(trimmed)}` : "";
    startTransition(() => {
      router.push(`/products${qs}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-xl gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={buttonLabel}
        className="h-12 flex-1 bg-background text-base"
      />
      <Button type="submit" size="lg" className="h-12 gap-2 px-6">
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>
    </form>
  );
}

export default HomeHeroSearch;
