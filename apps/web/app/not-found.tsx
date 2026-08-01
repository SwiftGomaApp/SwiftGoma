"use client";

import { useRouter } from "next/navigation";
import { Home, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Logo from "@/components/global/logo";

export default function NotFound() {
  const router = useRouter();

  const handleHome = () => {
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="absolute top-6">
        <Logo />
      </div>

      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <span className="font-sans text-[6rem] font-bold leading-none tracking-tight text-foreground sm:text-[8rem]">
          4
        </span>

        <span className="font-sans text-[6rem] font-bold leading-none tracking-tight text-primary sm:text-[8rem]">
          0
        </span>

        <span className="font-sans text-[6rem] font-bold leading-none tracking-tight text-foreground sm:text-[8rem]">
          4
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-semibold text-foreground sm:text-2xl">
          Page introuvable
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Retournez à l&apos;accueil, ou utilisez la recherche
        </p>
      </div>

      <form action="/recherche" className="w-full max-w-md">
        <div className="relative">
          <Input
            type="search"
            name="q"
            placeholder="Par exemple : chaussures, électronique..."
            className="h-12 pl-5 pr-12"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      <Button size="lg" onClick={handleHome}>
        <Home className="mr-2 h-4 w-4" />
        Retour à l&apos;accueil
      </Button>
    </main>
  );
}
