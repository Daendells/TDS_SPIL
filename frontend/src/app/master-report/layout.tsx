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
import AssignmentTable from "../assignments/assignmentTable";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        {/* SIDEBAR */}
        <AppSidebar />

        {/* MAIN CONTENT AREA */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* HEADER AREA (breadcrumb + optional button area) */}
          <header className="flex items-center justify-between px-6 py-4 border-b bg-background z-10 sticky top-0">
            <div className="flex items-center space-x-3 text-sm">
              <SidebarTrigger />
              <Separator orientation="vertical" />
              <Breadcrumb>
                <BreadcrumbList>
                  {segments.map((segment, index) => {
                    const href = "/" + segments.slice(0, index + 1).join("/");
                    return (
                      <React.Fragment key={href}>
                        {index > 0 && <BreadcrumbSeparator />}
                        <BreadcrumbItem>
                          <BreadcrumbLink
                            href={href}
                            className={
                              pathname === href
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                            }
                          >
                            {formatSegmet(segment)}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* SLOT: kanan atas (bisa dipakai tombol Add Report nanti) */}
            <div id="layout-header-action" />
          </header>

          {/* MAIN SCROLLABLE CONTENT */}
          <main className="flex-1 overflow-auto p-2 bg-muted/10">
            <section className="bg-background rounded-xl shadow-sm border p-6 min-h-[calc(100vh-180px)] overflow-auto">
              {children}
            </section>
            <AssignmentTable />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
