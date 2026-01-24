"use client";

import {
  LaptopMinimal,
  ChevronUp,
  Inbox,
  User2,
  Settings,
  Calendar,
  Users,
  History,
} from "lucide-react";

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
import { useLogout } from "@/app/(auth)/_hooks/useLogin";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LaptopMinimal,
  },
  {
    title: "Master Report",
    url: "/master-report",
    icon: LaptopMinimal,
  },
  {
    title: "Upload Excel",
    url: "/dashboard/excel",
    icon: Inbox,
  },
  {
    title: "Training Plan",
    url: "/dashboard/training-plan",
    icon: Calendar,
  },
  {
    title: "Assessment Manager",
    url: "/assessment-manager",
    icon: Settings,
  },
  {
    title: "Assessment Type Manager",
    url: "/assessment-type-manager",
    icon: Settings,
  },
  {
    title: "User Management",
    url: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Quiz History",
    url: "/quiz-history",
    icon: History,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const logoutMutation = useLogout();

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
              <DropdownMenuContent side="top" className="w-[--radix-popper-anchor-width]">
                <DropdownMenuItem className="p-0">
                  <Button
                    className="w-full"
                    variant="destructive"
                    disabled={logoutMutation.isPending}
                    onClick={() => logoutMutation.mutate()}
                  >
                    {logoutMutation.isPending ? "Signing out..." : "Sign out"}
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
