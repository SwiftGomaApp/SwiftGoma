import type { ReactNode } from "react";
import { getServerLocale } from "@/lib/language";
import { LegalSidebar } from "@/components/legal/legal-sidebar";
import { TableOfContents } from "@/components/legal/table-of-contents";
import { ContactSupportForm } from "@/components/legal/contact-support-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import Footer from "@/components/global/footer";

const LEGAL_LAYOUT_HEIGHT = "h-dvh";

export default async function LegalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getServerLocale();

  return (
    <>
      <div className={`flex w-full ${LEGAL_LAYOUT_HEIGHT} overflow-hidden`}>
        <aside className="hidden w-64 shrink-0 border-r border-border lg:block">
          <ScrollArea className="h-full">
            <div className="p-6">
              <LegalSidebar locale={locale} />
            </div>
          </ScrollArea>
        </aside>

        <ScrollArea className="min-w-0 flex-1">
          <div
            id="legal-content"
            className="mx-auto max-w-3xl px-6 py-10 sm:px-10 lg:px-12"
          >
            {children}

            <Separator className="my-10" />

            <ContactSupportForm locale={locale} />
          </div>
        </ScrollArea>

        <aside className="hidden w-64 shrink-0 border-l border-border lg:block">
          <ScrollArea className="h-full">
            <div className="p-6">
              <TableOfContents locale={locale} />
            </div>
          </ScrollArea>
        </aside>
      </div>

      <Footer />
    </>
  );
}
