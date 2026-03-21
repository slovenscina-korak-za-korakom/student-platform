import {
  Body,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components";
import type * as React from "react";
import BookingConfEmailContent from "./_components/booking-conf-email-content";

interface BookingConfEmailProps {
  name: string;
  locale: string;
  lessonDate: Date;
  lessonDuration: number;
  teacherName: string;
  lessonTheme: string;
  lessonLocation: string;
  lessonDescription: string;
  lessonLevel: string;
}

export const BookingConfEmail = ({
  name,
  locale = "en",
  lessonDate,
  lessonDuration,
  teacherName,
  lessonTheme,
  lessonDescription,
  lessonLevel,
  lessonLocation,
}: BookingConfEmailProps) => {
  const translations = {
    sl: {
      preview: "Potrditev rezervacije - Pogovorni klub",
    },
    en: {
      preview: "Booking Confirmation - Language club",
    },
    it: {
      preview:
        "Conferma Prenotazione - Club della lingua",
    },
    ru: {
      preview:
        "Подтверждение бронирования - Разговорный клуб",
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
          <BookingConfEmailContent
            name={name}
            locale={locale}
            lessonDate={lessonDate}
            lessonDuration={lessonDuration}
            teacherName={teacherName}
            lessonTheme={lessonTheme}
            lessonLocation={lessonLocation}
            lessonDescription={lessonDescription}
            lessonLevel={lessonLevel}
          />
        </Body>
      </Tailwind>
    </Html>
  );
};

export default BookingConfEmail;

// Preview props for testing
BookingConfEmail.PreviewProps = {
  name: "Sebastjan Bas",
  locale: "ru",
  lessonDate: new Date(),
  lessonDuration: 60,
  teacherName: "Anna Novak",
  lessonTheme: "Culture",
  lessonLocation: "Ljubljana, Slovenia",
  lessonDescription: "Slovene culture, traditions, and customs.",
  lessonLevel: "A1",
} satisfies BookingConfEmailProps;
