import {
  Body,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components";
import type * as React from "react";
import WelcomeEmailContent from "./_components/welcom-email-content";

interface WelcomeEmailProps {
  name: string;
  locale: string;
}

export const WelcomeEmail = ({ name, locale = "en" }: WelcomeEmailProps) => {
  const translations = {
    sl: {
      preview:
        "Dobrodošli v Slovenščina Korak za Korakom - Začnite svojo pot do slovenščine!",
    },
    en: {
      preview:
        "Welcome to Slovenščina Korak za Korakom - Start Your Slovene Learning Journey!",
    },
    it: {
      preview:
        "Benvenuto in Slovenščina Korak za Korakom - Inizia il tuo viaggio di apprendimento sloveno!",
    },
    ru: {
      preview:
        "Добро пожаловать в Slovenščina Korak za Korakom - Начните свой путь к изучению словенского языка!",
    },
  };

  return (
    <Html>
      <Head />
      <Tailwind config={{ presets: [pixelBasedPreset] }}>
        <Preview>
          {translations[locale as keyof typeof translations].preview}
        </Preview>
        <Body
          className="bg-gray-50 font-sans text-base"
          style={{
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <WelcomeEmailContent name={name} locale={locale} />
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  name: "John",
  locale: "ru",
} satisfies WelcomeEmailProps;

export default WelcomeEmail;
