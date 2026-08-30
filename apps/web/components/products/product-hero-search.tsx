"use client";

import { useState, useTransition, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductHeroSearch({
  initialSearch,
  placeholder,
  buttonLabel,
}: {
  initialSearch: string;
  placeholder: string;
  buttonLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialSearch);
  const [, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = value.trim();
    if (trimmed) params.set("search", trimmed);
    else params.delete("search");
    params.delete("page");

    const qs = params.toString();
    startTransition(() => {
      router.push(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-xl gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={buttonLabel}
        className="flex-1"
      />
      <Button type="submit" size="lg" className="h-9 gap-2 px-6">
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{buttonLabel}</span>
      </Button>
    </form>
  );
}

export default ProductHeroSearch;
