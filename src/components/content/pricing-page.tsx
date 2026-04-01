"use client";
import {offers} from "@/lib/docs";
import {CheckIcon} from "@heroicons/react/20/solid";
import {useTranslations} from "next-intl";
import {useState} from "react";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function PricingContent() {
  const t = useTranslations("pricing.plans");
  const t2 = useTranslations("pricing.cta");
  const [role, setRole] = useState<"senior" | "junior">("senior");
  return (
    <>

      <div
        className="relative flex flex-row bg-[#DAB3E2]/30 dark:bg-[#CE74E3]/10 gap-1 w-fit p-1 rounded-full cursor-pointer items-center justify-center my-16 mx-auto">
        <span
          className="absolute inset-1 bg-background rounded-full transition-[clip-path] duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]"
          style={{clipPath: role === "junior" ? "inset(0 50% 0 0 round 9999px)" : "inset(0 0 0 50% round 9999px)"}}
        />
        <button onClick={() => setRole("junior")}
                className={`${role === "junior" ? "text-foreground" : "text-foreground/50"} relative z-10 px-5 py-2 text-base tracking-wide cursor-pointer font-semibold transition-colors duration-300`}>
          {t("type.junior")}
        </button>
        <button onClick={() => setRole("senior")}
                className={`${role === "senior" ? "text-foreground" : "text-foreground/50"} relative z-10 px-5 py-2 text-base tracking-wide cursor-pointer font-semibold transition-colors duration-300`}>
          {t("type.senior")}
        </button>
      </div>

      <div
        className="mx-auto grid max-w-lg grid-cols-1 items-center gap-6 sm:gap-y-0 md:max-w-5xl md:grid-cols-3">
        {offers.map((tier, tierIdx) => (
          <div
            key={tier.id}
            className={classNames(
              tier.featured
                ? "relative bg-gradient-primary shadow-2xl ring-2 ring-sl-accent/50 scale-105"
                : "bg-gradient-primary-subtle border border-border/50 sm:mx-0 md:mx-0",
              "rounded-3xl p-8 sm:p-10 transition-all duration-300 hover:shadow-xl hover:shadow-sl-accent/20",
              tier.featured ? "z-10" : "hover:scale-[1.01]",
            )}
          >
            {tier.featured && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-primary rounded-t-3xl"/>
            )}
            <h3
              id={tier.id}
              className={classNames(
                "text-sm font-bold uppercase tracking-wider mb-2 text-sl-accent",
              )}
            >
              {t(`plan${tierIdx + 1}.name`)}
            </h3>
            <p className="mt-4 flex items-baseline gap-x-2">
            <span
              className={classNames(
                "text-5xl font-bold font-sans tracking-tight text-sl-primary",
              )}
            >
              {tier.priceMonthly[role].split(".")[0]}
              <span className="text-4xl">
                {tier.priceMonthly[role].split(".").length > 1 &&
                  "." + tier.priceMonthly[role].split(".")[1]}
              </span>
            </span>
              <span
                className={classNames(
                  tier.featured ? "text-foreground" : "text-sl-secondary",
                  "text-base font-medium",
                )}
              >
              /{t("session")}
            </span>
            </p>
            <p
              className={classNames(
                tier.featured
                  ? "text-sl-secondary dark:text-foreground"
                  : "text-sl-secondary",
                "mt-6 text-base/7",
              )}
            >
              {t(`plan${tierIdx + 1}.description`)}
            </p>
            <ul
              role="list"
              className={classNames("mt-8 space-y-4 text-sm/6 sm:mt-10")}
            >
              {[...Array(tier.features)].map((_, i) => (
                <li key={i} className="flex items-start gap-x-3">
                  <div
                    className={classNames(
                      "flex-shrink-0 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-sl-accent/40",
                    )}
                  >
                    <CheckIcon
                      aria-hidden="true"
                      className={classNames("text-white", "h-3.5 w-3.5")}
                    />
                  </div>
                  <span
                    className={classNames(
                      tier.featured
                        ? "text-sl-secondary dark:text-foreground"
                        : "text-sl-secondary",
                    )}
                  >
                  {t(`plan${tierIdx + 1}.features.${i}`)}
                </span>
                </li>
              ))}
            </ul>
            <a
              href={tier.href}
              aria-describedby={tier.id}
              className={classNames(
                tier.featured
                  ? "bg-background text-sl-accent dark:text-foreground hover:bg-background/90 shadow-lg hover:shadow-xl transition-all duration-300 dark:shadow-sl-accent/20 dark:shadow-xl"
                  : "bg-gradient-primary text-sl-secondary hover:opacity-90 shadow-lg shadow-sl-accent/20 hover:shadow-xl hover:shadow-sl-accent/30 transition-all duration-300",
                "mt-8 block rounded-xl px-4 py-3 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sl-accent sm:mt-10 border-sl-accent/50 border-[1px]",
              )}
            >
              {t2("button")}
            </a>
          </div>
        ))}
      </div>
    </>
  );
}
