import { TopNav } from "@/components/top-nav";
import { Sidebar } from "@/components/sidebar";
import { groupedEndpoints } from "@/lib/combined-endpoints";

export default function ReferenceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopNav
        mobileNav={<Sidebar variant="mobile" sectionRoot="/reference" groups={groupedEndpoints()} />}
      />
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 px-4 sm:px-10 lg:px-16">
        <Sidebar sectionRoot="/reference" groups={groupedEndpoints()} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
