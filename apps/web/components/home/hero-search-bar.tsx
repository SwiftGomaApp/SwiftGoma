"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useCarousel } from "@/components/ui/carousel";

type HeroSearchBarProps = {
  placeholder: string;
  className?: string;
};

export function HeroSearchBar({ placeholder, className }: HeroSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const { api } = useCarousel();

  useEffect(() => {
    const autoplay = api?.plugins()?.autoplay;
    if (!autoplay) return;
    if (isPending) {
      autoplay.stop();
    } else {
      autoplay.play();
    }
  }, [isPending, api]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (value.trim()) params.set("search", value.trim());
    const target = `/products${params.toString() ? `?${params.toString()}` : ""}`;

    startTransition(() => {
      router.push(target);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className={cn("relative w-full max-w-xl", className)}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={isPending}
        className="h-12 w-full pl-11 pr-14 bg-background disabled:opacity-100 disabled:bg-background"
      />
      <button
        type="submit"
        disabled={isPending}
        aria-label="Rechercher"
        aria-busy={isPending}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-70 sm:h-10 sm:w-10"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </button>
    </form>
  );
}
