"use client";

import { LaptopMinimal, ChevronUp, Inbox, User2, FileText } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import { useRouter } from "next/navigation";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LaptopMinimal,
  },
  {
    title: "Upload Excel",
    url: "/dashboard/excel",
    icon: Inbox,
  },
  {
    title: "Report Mentoring",
    url: "/dashboard/report-mentoring",
    icon: FileText,
  },
  {
    title: "Training",
    url: "/dashboard/training",
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const api = useApi();

  const [onLogout, setOnLogout] = useState(false);

  const logout = async () => {
    try {
      const response = await api.post("/auth/logout");
      setUser(null); 
      router.replace("/login");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setOnLogout(false);
    }
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="py-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="py-6 px-2">
                  <div className="flex gap-x-2 items-center">
                    <Image
                      src="/images/spil_logo.svg"
                      alt="Logo SPIL"
                      width={34}
                      height={34}
                      className="mr-2 w-[30%]"
                    />
                    <h2 className="text-2xl font-bold text-center">SPIL</h2>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link key={item.url} href={item.url}>
                      <item.icon />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> {user?.username}
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem className="p-0">
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={onLogout}
                    onClick={() => logout()}
                  >
                    Sign out
                  </Button>
                  {/* <span>Sign out</span> */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
