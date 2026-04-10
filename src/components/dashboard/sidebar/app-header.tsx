"use client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Skeleton from "react-loading-skeleton";
import { Link } from "@/i18n/routing";
import { usePathname } from "next/navigation";
import {
  IconUserCircle,
  IconCreditCard,
  IconNotification,
  IconLogout,
} from "@tabler/icons-react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

export function SiteHeader() {
  const pathname = usePathname();
  const title = decodeURIComponent(pathname.split("/").pop())
  const { user } = useUser();
  const t = useTranslations("dashboard.user-navigation");

  return (
    <header className="flex h-(--header-height) sticky top-0 z-30 left-0 bg-background shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium capitalize">
          {title.replaceAll("-", " ")}
        </h1>
        <div className="ml-auto flex items-center h-full gap-2">
          {!user ? (
            <div className="inline-flex items-center px-4">
              <Skeleton circle width={40} height={40} containerClassName="leading-none" />
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="cursor-pointer">
                <Button
                  variant="ghost"
                  className="hover:bg-transparent gap-5 !focus:outline-none outline-none focus-visible:outline-none border-none focus:border-none focus-visible:border-none focus:ring-0 focus-visible:ring-0"
                >
                  <Avatar className="h-9 w-9 rounded-full">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName} />
                    <AvatarFallback className="rounded-full"></AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side={"bottom"}
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex flex-col justify-center items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-16 w-16 rounded-full">
                      <AvatarImage src={user?.imageUrl} alt={user?.fullName} />
                      <AvatarFallback className="rounded-full"></AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-center text-sm leading-tight">
                      <span className="truncate font-medium">
                        {user?.fullName}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user?.emailAddresses[0].emailAddress}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="cursor-pointer flex items-center gap-2 hover:bg-transparent"
                    >
                      <IconUserCircle />
                      {t("account")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <IconCreditCard />
                    {t("billing")}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <IconNotification />
                    {t("notifications")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <SignOutButton>
                  <DropdownMenuItem className="cursor-pointer">
                    <IconLogout />
                    {t("logout")}
                  </DropdownMenuItem>
                </SignOutButton>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
