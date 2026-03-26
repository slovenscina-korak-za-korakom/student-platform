"use client";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import React from "react";

export const EmailComponent = () => {
  const t = useTranslations("pricing.contact");
  return (
    <div className="relative overflow-hidden py-16 sm:py-24 lg:py-32 mx-auto max-w-lg md:max-w-4xl px-6 lg:px-8">
      <h2 className="text-4xl font-semibold tracking-tight text-sl-primary">
        {t("title")}
      </h2>
      <p className="mt-4 text-lg text-sl-secondary">{t("subtitle")}</p>
      <Button variant="mine" className="mt-8" asChild>
        <a href="mailto:sebastjan.bas@gmail.com?cc=almn140803@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.>">
          {t("button")}
        </a>
      </Button>
    </div>
  );
};
