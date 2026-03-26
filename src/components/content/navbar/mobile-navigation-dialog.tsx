import { Dialog, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
// import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./language-switcher";
import { IconLogo } from "@/components/icons/icon-logo";
import { ThemButton } from "@/components/ui/appearance-switch-button";
import { useUser } from "@clerk/nextjs";
import { Link } from "@/i18n/routing";

export default function MobileNavigationDialog({
  mobileMenuOpen,
  setMobileMenuOpen,
  webNavigation,
  locale,
}) {
  const t = useTranslations("common");
  const { user } = useUser();

  return (
    <div>
      <AnimatePresence mode="wait" initial={false}>
        {mobileMenuOpen && (
          <Dialog
            open={mobileMenuOpen}
            onClose={setMobileMenuOpen}
            as={motion.div} // Make the Dialog itself animated
            static // Ensures Dialog content stays in the DOM for animations
          >
            <div className="lg:hidden">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-50 bg-black/50 dark:bg-black/25 backdrop-blur-sm px-6 py-6 shadow-lg"
              />

              <DialogPanel>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="bg-white dark:bg-[#242424] fixed overflow-hidden inset-0 z-50 h-screen max-h-screen w-screen supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh]"
                >
                  <div className="absolute h-16 px-6 py-9 flex items-center justify-between w-screen left-0 top-0 z-50 bg-white dark:bg-[#242424]">
                    <Link
                      href="/"
                      type="button"
                      className="block w-auto h-6 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:ring-offset-4 focus-visible:ring-offset-background-alternative focus-visible:rounded-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Slovenščina Korak za Korkom</span>
                      <IconLogo className="h-7 w-auto" />
                    </Link>
                    <div className="flex flex-row justify-center items-center gap-2">
                      <div className="w-fit mx-5">
                        <LanguageSwitcher locale={locale} />
                      </div>
                      <ThemButton />
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className="inline-flex items-center justify-center p-2 rounded-md text-foreground-lighter focus:ring-brand hover:text-foreground-light transition-colors focus:outline-none focus:ring-2 focus:ring-inset cursor-pointer"
                      >
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon aria-hidden="true" className="size-6" />
                      </button>
                    </div>
                  </div>
                  <div className="max-h-screen flex flex-col justify-between supports-[height:100cqh]:h-[100cqh] supports-[height:100svh]:h-[100svh] overflow-y-auto pt-20 pb-32 px-4">
                    <div className=" flex flex-col space-y-1">
                      {webNavigation.map((item) => (
                        <div
                          key={item.name}
                          className="border-b border-gray-200 dark:border-white/10 hover:bg-gray-200/30 dark:hover:bg-white/5"
                        >
                          <Link
                            href={item.href}
                            className="block py-2 pl-3 pr-4 text-base font-medium text-foreground hover:bg-surface-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:rounded"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {t(`navigation.${item.name}`)}
                          </Link>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 mb-10">
                      <div className="w-full flex justify-between items-center">
                        {!user ? (
                          <a
                            href={`/sign-in?locale=${locale}`}
                            className="block py-2 pl-3 pr-4 text-base font-medium text-foreground hover:bg-surface-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:rounded"
                          >
                            <p className="truncate">{t("buttons.log-in")}</p>
                          </a>
                        ) : (
                          <Link
                            href="/dashboard"
                            className="block py-2 pl-3 pr-4 text-base font-medium text-foreground hover:bg-surface-200 focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-foreground-lighter focus-visible:rounded"
                          >
                            <p className="truncate">
                              {t("navigation.dashboard")}
                            </p>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </DialogPanel>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}
