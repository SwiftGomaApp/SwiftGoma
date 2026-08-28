import { TopNav } from "@/components/top-nav";
import { DocsSidebar } from "@/components/docs-sidebar";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav mobileNav={<DocsSidebar variant="mobile" />} />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 sm:px-10 lg:px-16">
        <DocsSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
