"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { formatSegmet } from "@/lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden w-full">
          <header className="flex items-center justify-between px-6 py-3.5 border-b bg-white sticky top-0 z-10">
            <div className="flex items-center space-x-3 text-sm">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  {segments.map((segment, index) => {
                    const href = "/" + segments.slice(0, index + 1).join("/");
                    return (
                      <React.Fragment key={href}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          <BreadcrumbLink href={href}>
                            {segment === "spreadsheet-analytics" ? "Spreadsheet Analytics (DISC)" : formatSegmet(segment)}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="flex-1 overflow-auto bg-slate-50/60">
            <section className="min-h-[calc(100vh-73px)] w-full px-4 py-5 md:px-6 md:py-6">
              {children}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
