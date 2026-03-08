import "./globals.css";
import { LocaleProvider } from "@/contexts/locale-context";
import { DynamicClerkProvider } from "@/components/providers/dynamic-clerk-provider";
import { Suspense } from "react";
import {Metadata} from "next";

export const metadata : Metadata = {
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

export default function RootLayout({ children, params }) {
  const { locale } = params || {};
  const initialLocale = locale || "en";

  return (
    <Suspense>
      <LocaleProvider initialLocale={initialLocale}>
        <DynamicClerkProvider>{children}</DynamicClerkProvider>
      </LocaleProvider>
    </Suspense>
  );
}
