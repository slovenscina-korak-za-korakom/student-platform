import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "sl", "ru", "it"],

  // Used when no locale matches
  defaultLocale: "en",

  pathnames: {
    // If all locales use the same pathname, a single
    // external path can be used for all locales
    "/": "/",

    // If locales use different paths, you can
    // specify each external path per locale

    // PUBLIC
    "/about-us": {
      en: "/about-us",
      sl: "/o-nas",
      ru: "/o-нас",
      it: "/chi-siamo",
    },

    "/pricing": {
      en: "/pricing",
      sl: "/cena",
      ru: "/ценообразование",
      it: "/prezzi",
    },

    // LEGAL
    "/legal/terms-of-service": {
      en: "/legal/terms-of-service",
      sl: "/legal/terms-of-service",
      ru: "/legal/terms-of-service",
      it: "/legale/termini-di-servizio",
    },

    "/legal/privacy-policy": {
      en: "/legal/privacy-policy",
      sl: "/legal/privacy-policy",
      ru: "/legal/privacy-policy",
      it: "/legale/informativa-sulla-privacy",
    },

    "/legal/license": {
      en: "/legal/license",
      sl: "/legal/license",
      ru: "/legal/license",
      it: "/legale/licenza",
    },

    "/welcome": {
      en: "/welcome",
      sl: "/dobrodosli",
      ru: "/добро-пожаловать",
      it: "/benvenuto",
    },

    // PROTECTED
    "/dashboard": {
      en: "/dashboard",
      sl: "/dashboard",
      ru: "/dashboard",
      it: "/dashboard",
    },

    "/courses": {
      en: "/courses",
      sl: "/tecaji",
      ru: "/продукты",
      it: "/corsi",
    },

    "/calendar": {
      en: "/calendar",
      sl: "/koledar",
      ru: "/календарь",
      it: "/calendario",
    },

    "/settings": {
      en: "/settings",
      sl: "/nastavitve",
      ru: "/настройки",
      it: "/impostazioni",
    },

    "/language-club": {
      en: "/language-club",
      sl: "/pogovorni-klub",
      ru: "/Разговорный клуб",
      it: "/club-linguistico",
    },

    "/daily-practice": {
      en: "/daily-practice",
      sl: "/dnevne-naloge",
      ru: "/ежедневная-практика",
      it: "/daily-practice",
    },
  },
});

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
