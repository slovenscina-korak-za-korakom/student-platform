import React from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { WelcomeRedirectProvider } from "@/components/providers/welcome-redirect-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages(locale);
  await setRequestLocale(locale);

  return (
    <NextIntlClientProvider messages={messages}>
      <WelcomeRedirectProvider>
        <TooltipProvider>
          <main>{children}</main>
        </TooltipProvider>
      </WelcomeRedirectProvider>
    </NextIntlClientProvider>
  );
}