import {
  Body,
  Head,
  Html,
  Preview,
  pixelBasedPreset,
  Tailwind,
} from "@react-email/components";
import type * as React from "react";
import RescheduleConfEmailContent from "./_components/reschedule-conf-email-content";

interface RescheduleConfEmailProps {
  name: string;
  locale: string;
  // Old booking details
  oldLessonDate: Date;
  oldLessonDuration: number;
  oldTeacherName: string;
  oldLessonTheme: string;
  oldLessonLocation: string;
  oldLessonDescription?: string;
  oldLessonLevel?: string;
  // New booking details
  newLessonDate: Date;
  newLessonDuration: number;
  newTeacherName: string;
  newLessonTheme: string;
  newLessonLocation: string;
  newLessonDescription?: string;
  newLessonLevel?: string;
}

export const RescheduleConfEmail = ({
  name,
  locale = "en",
  oldLessonDate,
  oldLessonDuration,
  oldTeacherName,
  oldLessonTheme,
  oldLessonLocation,
  oldLessonDescription,
  oldLessonLevel,
  newLessonDate,
  newLessonDuration,
  newTeacherName,
  newLessonTheme,
  newLessonLocation,
  newLessonDescription,
  newLessonLevel,
}: RescheduleConfEmailProps) => {
  const translations = {
    sl: {
      preview: "Ponovna rezervacija - Vaša rezervacija je bila spremenjena",
    },
    en: {
      preview: "Reschedule Confirmation - Your booking has been updated",
    },
    it: {
      preview: "Conferma Riprogrammazione - La tua prenotazione è stata aggiornata",
    },
    ru: {
      preview: "Подтверждение переноса - Ваше бронирование обновлено",
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
          <RescheduleConfEmailContent
            name={name}
            locale={locale}
            oldLessonDate={oldLessonDate}
            oldLessonDuration={oldLessonDuration}
            oldTeacherName={oldTeacherName}
            oldLessonTheme={oldLessonTheme}
            oldLessonLocation={oldLessonLocation}
            oldLessonDescription={oldLessonDescription}
            oldLessonLevel={oldLessonLevel}
            newLessonDate={newLessonDate}
            newLessonDuration={newLessonDuration}
            newTeacherName={newTeacherName}
            newLessonTheme={newLessonTheme}
            newLessonLocation={newLessonLocation}
            newLessonDescription={newLessonDescription}
            newLessonLevel={newLessonLevel}
          />
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RescheduleConfEmail;

// Preview props for testing
RescheduleConfEmail.PreviewProps = {
  name: "Sebastjan Bas",
  locale: "ru",
  oldLessonDate: new Date("2024-12-20T10:00:00"),
  oldLessonDuration: 60,
  oldTeacherName: "Anna Novak",
  oldLessonTheme: "Culture",
  oldLessonLocation: "Ljubljana, Slovenia",
  oldLessonDescription: "Slovene culture, traditions, and customs.",
  oldLessonLevel: "A1",
  newLessonDate: new Date("2024-12-25T14:00:00"),
  newLessonDuration: 60,
  newTeacherName: "Anna Novak",
  newLessonTheme: "Culture",
  newLessonLocation: "Ljubljana, Slovenia",
  newLessonDescription: "Slovene culture, traditions, and customs.",
  newLessonLevel: "A1",
} satisfies RescheduleConfEmailProps;

