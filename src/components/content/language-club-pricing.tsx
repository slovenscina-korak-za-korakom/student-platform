"use client";
import {useLocale, useTranslations} from "next-intl";
import {Link} from "@/i18n/routing";
import {IconCheck} from "@tabler/icons-react";

export default function LanguageClub() {
  const locale = useLocale()
  const t = useTranslations("pricing.language-club");
  const t2 = {
    en: "up to",
    sl: "do",
    ru: "до",
    it: "fino a"
  }

  return (
    <div id={"lang-club"} className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mt-24">
      <div className="relative overflow-hidden bg-gradient-to-br from-sl-purple/10 via-sl-blue/8 to-sl-pink/10 border-y border-sl-accent/30 shadow-2xl shadow-sl-accent/20 dark:shadow-sl-accent/10">
        {/* Background pattern overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white_70%,transparent)]" />
        </div>

        <div className="relative mx-auto max-w-5xl px-8 py-12 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <span className="text-sm font-bold uppercase tracking-wider text-sl-accent">
                {t("badge")}
              </span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tighter text-sl-primary dark:text-white mb-4">
              {t("title")}
            </h2>
            <p className="mx-auto max-w-2xl text-lg sm:text-xl text-sl-secondary dark:text-white/80 tracking-tight leading-relaxed">
              {t("description")}
            </p>
          </div>

          {/* Pricing highlight */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12 pb-12 border-b border-border/50">
            <div className="text-center sm:text-left">
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-5xl sm:text-6xl font-sans font-bold tracking-tight text-sl-primary dark:text-white">
                  €12.50
                </span>
              </div>
              <p className="mt-2 text-base sm:text-lg tracking-tight text-sl-secondary dark:text-white/70">
                {t("price-label")}
              </p>
            </div>
            <div className="hidden sm:block w-px h-16 bg-border/50" />
            <div className="text-center sm:text-left">
              {/*<div className="text-3xl sm:text-4xl font-bold text-sl-primary dark:text-white">*/}
              <div className="text-5xl sm:text-6xl font-bold tracking-tight text-sl-primary dark:text-white">
                <span className={"text-3xl mr-2"}>
                  {t2[locale]}
                </span>
               8
              </div>
              <p className="mt-2 text-base sm:text-lg text-sl-secondary dark:text-white/70">
                {t("group-size")}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-6 rounded-2xl bg-gradient-primary-subtle/50 border border-border/30 hover:border-sl-accent/40 transition-all duration-300 hover:shadow-lg hover:shadow-sl-accent/10"
              >
                <div className="flex-shrink-0 mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sl-accent/40 to-sl-purple/40 shadow-sm">
                  <IconCheck
                    size={16}
                    aria-hidden="true"
                    className="text-white"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-sl-primary dark:text-white mb-1">
                    {t(`features.${i}.title`)}
                  </p>
                  <p className="text-sm text-sl-secondary dark:text-white/70 leading-relaxed">
                    {t(`features.${i}.description`)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="mt-12 text-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-primary px-8 py-4 text-base font-semibold text-sl-secondary dark:text-white shadow-lg shadow-sl-accent/20 hover:shadow-xl hover:shadow-sl-accent/30 transition-all duration-300 border border-sl-accent/50 hover:scale-105"
            >
              {t("cta")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

