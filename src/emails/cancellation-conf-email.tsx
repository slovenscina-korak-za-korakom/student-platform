import {
  Body,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components";
import type * as React from "react";
import CancellationConfEmailContent from "./_components/cancellation-conf-email-content";

interface CancellationConfEmailProps {
  name: string;
  locale: string;
  eventType: "language-club" | "personal-session";
  // Language Club fields
  lessonDate?: Date;
  lessonDuration?: number;
  teacherName?: string;
  lessonTheme?: string;
  lessonLocation?: string;
  lessonDescription?: string;
  lessonLevel?: string;
  // Personal Session fields
  startTime?: Date;
  duration?: number;
  tutorName?: string;
  sessionType?: string;
  location?: string;
}

export const CancellationConfEmail = ({
  name,
  locale = "en",
  eventType,
  // Language Club
  lessonDate,
  lessonDuration,
  teacherName,
  lessonTheme,
  lessonLocation,
  lessonDescription,
  lessonLevel,
  // Personal Session
  startTime,
  duration,
  tutorName,
  sessionType,
  location,
}: CancellationConfEmailProps) => {
  const translations = {
    sl: {
      preview: "Potrditev preklica - Rezervacija je preklicana",
    },
    en: {
      preview: "Cancellation Confirmation - Booking Cancelled",
    },
    it: {
      preview: "Conferma Cancellazione - Prenotazione Cancellata",
    },
    ru: {
      preview: "Подтверждение отмены - Бронирование отменено",
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
          <CancellationConfEmailContent
            name={name}
            locale={locale}
            eventType={eventType}
            lessonDate={lessonDate}
            lessonDuration={lessonDuration}
            teacherName={teacherName}
            lessonTheme={lessonTheme}
            lessonLocation={lessonLocation}
            lessonDescription={lessonDescription}
            lessonLevel={lessonLevel}
            startTime={startTime}
            duration={duration}
            tutorName={tutorName}
            sessionType={sessionType}
            location={location}
          />
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CancellationConfEmail;

// Preview props for testing - Language Club
// CancellationConfEmail.PreviewProps = {
//   name: "Sebastjan Bas",
//   locale: "en",
//   eventType: "language-club" as const,
//   lessonDate: new Date(),
//   lessonDuration: 60,
//   teacherName: "Anna Novak",
//   lessonTheme: "Culture",
//   lessonLocation: "Ljubljana, Slovenia",
//   lessonDescription: "Slovene culture, traditions, and customs.",
//   lessonLevel: "A1",
// } satisfies CancellationConfEmailProps;

// Preview props for testing - Personal Session (uncomment to use)
CancellationConfEmail.PreviewProps = {
  name: "Sebastjan Bas",
  locale: "ru",
  eventType: "personal-session" as const,
  startTime: new Date(),
  duration: 60,
  tutorName: "Anna Novak",
  sessionType: "Conversational Practice",
} satisfies CancellationConfEmailProps;

