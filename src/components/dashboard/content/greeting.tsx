"use client";
import React from "react";
import { useTranslations } from "next-intl";
import {useUser} from "@clerk/nextjs";

const Greeting = () => {
  const {user} = useUser();
  const t = useTranslations("dashboard");

  if (!user) {
    return (
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-700">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-[-0.06em] text-foreground">
          {t("greeting-placeholder")}
        </h1>
        <p className="text-base md:text-lg text-muted-foreground font-normal">
          {t("greeting-subheading", { defaultValue: "Here's what's happening today" })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-700">
      <h1
        dangerouslySetInnerHTML={{
          __html: t.markup("greeting", {
            important: (chunks) => `
            <strong style="font-weight: 700;">${chunks}</strong>
            `,
            name: user.fullName.split(" ")?.[0],
          }),
        }}
        className="block text-3xl md:text-5xl font-semibold tracking-[-0.06em] text-foreground"
      />
      <p className="text-base md:text-lg text-muted-foreground/70 font-normal">
        {t("greeting-subheading", { defaultValue: "Here's what's happening today" })}
      </p>
    </div>
  );
};

export default Greeting;
