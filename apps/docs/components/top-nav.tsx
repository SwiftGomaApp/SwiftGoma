import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SectionTabs } from "@/components/section-tabs";
import { SearchCommand } from "@/components/search-command";
import { MobileNav } from "@/components/mobile-nav";

export function TopNav({ mobileNav }: { mobileNav?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="border-b border-border px-4 sm:px-10 lg:px-16">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 sm:gap-4">
          {mobileNav && <MobileNav>{mobileNav}</MobileNav>}
          <Logo href="/docs" size={18} />

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <SearchCommand />
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:inline">
              v1
            </span>
            <ThemeToggle />
          </div>
        </div>
      </div>
      <SectionTabs />
    </header>
  );
}
