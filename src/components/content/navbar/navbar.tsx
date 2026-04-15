/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { webNavigation } from "@/lib/docs";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";
import { useUser } from "@clerk/nextjs";
import MobileNavigationDialog from "./mobile-navigation-dialog";
import { IconLogo } from "@/components/icons/icon-logo";
import { ThemButton } from "@/components/ui/appearance-switch-button";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {IconMenu2} from "@tabler/icons-react";

export default function NavBar({ locale }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("common");
  const { user } = useUser();

  if (pathname.includes("/auth") || pathname.includes("/legal")) {
    return null;
  }

  return (
    <header className="fixed bg-background/90 dark:bg-[#131014]/90 py-2 lg:py-3 border-b border-border/50 dark:border-border/30 inset-x-0 top-0 z-50">
      <nav
        aria-label="Global"
        className="relative flex justify-between items-center h-16 mx-auto lg:container lg:px-16 xl:px-20"
      >
        <div className="flex items-center px-6 lg:px-0 flex-1 sm:items-stretch justify-between">
          <div className="flex items-center">
            <div className="flex items-center flex-shrink-0">
              <Link
                href="/"
                type="button"
                className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
              >
                <span className="sr-only">Slovenščina Korak za Korkom</span>
                <IconLogo className={"size-5 h-7 w-auto"} />
              </Link>
            </div>

            <nav className="relative z-10 flex-1 items-center justify-center hidden pl-8 sm:space-x-4 lg:flex h-16">
              <ul className="group flex flex-1 list-none items-center justify-center space-x-1">
                {webNavigation.map((item) => (
                  <li className="text-sm font-medium" key={item.name}>
                    <Link
                      href={item.href as any}
                      className="group/menu-item flex items-center text-sm font-medium select-none gap-3 rounded-lg px-3 py-2 leading-none no-underline outline-none focus-visible:ring-2 focus-visible:ring-sl-accent/50 transition-all duration-200 text-foreground/80 hover:text-sl-accent hover:bg-gradient-primary-subtle"
                    >
                      <div className="flex flex-col justify-center">
                        <div className="flex items-center gap-1">
                          <p className="leading-snug">
                            {t(`navigation.${item.name}`)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="absolute left-0 top-full flex justify-center"></div>
            </nav>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-fit mx-5">
              <LanguageSwitcher className="rounded-lg" locale={locale} />
            </div>
            <ThemButton className="rounded-lg" />
            {user ? (
              <>
                {/* <UserButton dialog={false} /> */}
                <Button variant={"mine"} asChild>
                  <Link href="/dashboard">
                    <p className="truncate">{t("navigation.dashboard")}</p>
                  </Link>
                </Button>
              </>
            ) : (
              <Button variant={"mine"} asChild>
                <a href={`/sign-in?locale=${locale}`}>
                  <p className="truncate">{t("buttons.log-in")}</p>
                </a>
              </Button>
            )}
          </div>
        </div>
        <div className="inset-y-0 flex mr-2 items-center px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="text-foreground-lighter cursor-pointer"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <IconMenu2
              size={20}
              aria-hidden="true"
            />
          </button>
        </div>
      </nav>
      <MobileNavigationDialog
        webNavigation={webNavigation}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        locale={locale}
      />
    </header>
  );
}
