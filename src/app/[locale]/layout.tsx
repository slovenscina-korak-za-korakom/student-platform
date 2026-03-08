import React from "react";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { WelcomeRedirectProvider } from "@/components/providers/welcome-redirect-provider";
import { Analytics } from "@vercel/analytics/next";

import { Manrope } from "next/font/google";
import localFont from "next/font/local";

const manropeFont = Manrope({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-manrope"
});

const tankerFont = localFont({
  src: "../fonts/tanker-regular.woff2",
  variable: "--font-tanker"
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages(locale);

  // Enable static rendering
  await setRequestLocale(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Slovenscina Korak za Korakom",
    url: "https://slovenscinakzk.com",
    description:
      "Personalized Slovene lessons tailored to your goals. Learn online with experienced teachers and join a community of over 1,700 members.",
    publisher: {
      "@type": "Organization",
      name: "Slovenscina Korak za Korakom",
      url: "https://slovenscinakzk.com",
      logo: {
        "@type": "ImageObject",
        url: "https://slovenscinakzk.com/logo-image.png",
      },
    },
  };

  return (
    <html lang={locale} suppressHydrationWarning className={`${manropeFont.variable} ${tankerFont.variable}`}>
      <body className={"font-manrope font-medium"}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Toaster richColors position="bottom-right" />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <WelcomeRedirectProvider>
              <main>{children}</main>
            </WelcomeRedirectProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
