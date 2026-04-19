import "./globals.css";
import "react-loading-skeleton/dist/skeleton.css";
import React, { Suspense } from "react";
import { Metadata } from "next";
import { Manrope } from "next/font/google";
import localFont from "next/font/local";
import { getLocale } from "next-intl/server";
import { LocaleProvider } from "@/contexts/locale-context";
import type { localeType } from "@/i18n/routing";
import { DynamicClerkProvider } from "@/components/providers/dynamic-clerk-provider";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

const manropeFont = Manrope({
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  subsets: ["latin", "latin-ext", "cyrillic", "cyrillic-ext"],
  variable: "--font-manrope",
});

const tankerFont = localFont({
  src: "./fonts/tanker-regular.woff2",
  variable: "--font-tanker",
});

export const metadata: Metadata = {
  title: {
    default: "Slovenscina Korak za Korakom | Become fluent in Slovene",
    template: "%s | Slovenscina Korak za Korakom",
  },
  description:
    "Slovenscina Korak za Korakom personalized Slovene lessons tailored to your goals. Learn online at your convenience with experienced teachers and join a supportive community of over 1,700 members. Start today and achieve your language goals with Slovenscina Korak za Korakom!",
  metadataBase: new URL("https://slovenscinakzk.com"),
  alternates: {
    canonical: "/",
    languages: {
      "x-default": "https://slovenscinakzk.com/en",
      en: "https://slovenscinakzk.com/en",
      sl: "https://slovenscinakzk.com/sl",
      ru: "https://slovenscinakzk.com/ru",
      it: "https://slovenscinakzk.com/it",
    },
  },
  openGraph: {
    type: "website",
    url: "https://slovenscinakzk.com",
    siteName: "Slovenscina Korak za Korakom | Become fluent in Slovene",
    images: [
      {
        url: "/meta-image-link.jpg",
        width: 769,
        height: 445,
        alt: "Slovenscina Korak za Korakom Open Graph Image",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

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

export default async function RootLayout({ children }) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${manropeFont.variable} ${tankerFont.variable}`}
    >
      <body className="font-manrope font-medium">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Toaster richColors position="bottom-right" />
        <Suspense>
          <LocaleProvider initialLocale={locale as localeType}>
            <DynamicClerkProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </DynamicClerkProvider>
          </LocaleProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
