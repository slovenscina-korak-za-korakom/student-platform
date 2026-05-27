import {
  Img,
  Column,
  Container,
  Row,
  Section,
  Heading,
  Text,
  Link,
  Button,
} from "@react-email/components";
import { toZonedTime } from "date-fns-tz";
import React from "react";

// Simple translation function for emails
const getEmailTranslations = (locale: string) => {
  const translations = {
    sl: {
      confirmation: "Potrditev osebne seje",
      subtitle: "Vaša osebna lekcija slovenščine je uspešno rezervirana!",
      sessionDetails: "Podrobnosti seje",
      date: "Datum",
      time: "Čas",
      duration: "Trajanje",
      teacher: "Tutor",
      topic: "Tema lekcije",
      level: "Nivo",
      joinSession: "Pridruži se seji",
      videoCall: "Video klic",
      preparationNotes: "Pripravljalne opombe",
      preparationNotesDesc:
        "Prosimo, da si preberete naslednje opombe pred začetkom seje:",
      seeYouSoon: "Vidimo se kmalu",
      dashboard: "Dashboard",
      about: "O nas",
      pricing: "Cenik",
      contact: "Kontakt",
      allRightsReserved: "Vse pravice pridržane",
      minutes: "minut",
    },
    en: {
      confirmation: "Personal Session Confirmation",
      subtitle: "Your personal Slovene lesson has been successfully booked!",
      sessionDetails: "Session Details",
      date: "Date",
      time: "Time",
      duration: "Duration",
      teacher: "Teacher",
      topic: "Lesson Topic",
      level: "Level",
      joinSession: "Join Session",
      videoCall: "Video Call",
      preparationNotes: "Preparation Notes",
      preparationNotesDesc:
        "Please review the following notes before your session:",
      seeYouSoon: "See you soon",
      dashboard: "Dashboard",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      allRightsReserved: "All Rights Reserved",
      minutes: "minutes",
    },
    it: {
      confirmation: "Conferma Sessione Personale",
      subtitle: "La tua lezione personale di sloveno è stata prenotata con successo!",
      sessionDetails: "Dettagli Sessione",
      date: "Data",
      time: "Ora",
      duration: "Durata",
      teacher: "Insegnante",
      topic: "Argomento Lezione",
      level: "Livello",
      joinSession: "Partecipa alla Sessione",
      videoCall: "Videochiamata",
      preparationNotes: "Note di Preparazione",
      preparationNotesDesc:
        "Ti preghiamo di rivedere le seguenti note prima della tua sessione:",
      seeYouSoon: "A presto",
      dashboard: "Dashboard",
      about: "Chi siamo",
      pricing: "Prezzi",
      contact: "Contatto",
      allRightsReserved: "Tutti i diritti riservati",
      minutes: "minuti",
    },
    ru: {
      confirmation: "Подтверждение персональной сессии",
      subtitle: "Ваш персональный урок словенского языка успешно забронирован!",
      sessionDetails: "Детали сессии",
      date: "Дата",
      time: "Время",
      duration: "Продолжительность",
      teacher: "Учитель",
      topic: "Тема урока",
      level: "Уровень",
      joinSession: "Присоединиться к сессии",
      videoCall: "Видеозвонок",
      preparationNotes: "Заметки для подготовки",
      preparationNotesDesc:
        "Пожалуйста, ознакомьтесь со следующими заметками перед вашей сессией:",
      seeYouSoon: "До скорой встречи",
      dashboard: "Dashboard",
      about: "О нас",
      pricing: "Цены",
      contact: "Контакты",
      allRightsReserved: "Все права защищены",
      minutes: "минут",
    },
  };

  return translations[locale as keyof typeof translations] || translations.en;
};

const SessionConfEmailContent = ({
  name,
  locale,
  startTime,
  duration,
  tutorName,
  sessionType,
  videoCallUrl,
}: {
  name: string;
  locale: string;
  startTime: Date;
  duration: number;
  tutorName: string;
  sessionType: string;
  videoCallUrl?: string | null;
}) => {
  const year = new Date().getFullYear();
  const t = getEmailTranslations(locale);

  // Format date for display
  const formattedDate = toZonedTime(
    startTime,
    "Europe/Ljubljana",
  ).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Main Container with max-width for modern look */}
      <Container
        className="max-w-[600px] mx-auto"
        style={{ backgroundColor: "#F9FAFB" }}
      >
        {/* Spacer for top padding */}
        <Section style={{ paddingTop: "40px" }} />

        {/* Main Content Card */}
        <Container
          className="bg-white rounded-[20px]"
          style={{
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            margin: "0 auto",
            padding: "48px 40px",
          }}
        >
          {/* Header with Logo */}
          <Section style={{ marginBottom: "32px" }}>
            <Row>
              <Column align="center">
                <Img
                  src={`https://www.slovenscinakzk.com/logo-image.png`}
                  alt="Slovenščina Korak za Korakom"
                  width={64}
                  height={64}
                  style={{ borderRadius: "16px" }}
                />
              </Column>
            </Row>
            <Section className="text-center" style={{ marginTop: "24px" }}>
              <Text
                className="font-semibold"
                style={{
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "#A855F7",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                  background:
                    "linear-gradient(135deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Slovenščina Korak za Korakom
              </Text>
              <Heading
                as="h1"
                style={{
                  fontSize: "32px",
                  lineHeight: "40px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 12px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {t.confirmation}
              </Heading>
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                {t.subtitle}
              </Text>
            </Section>
          </Section>

          {/* Purple-Blue-Pink Gradient Accent Line */}
          <Section
            style={{
              height: "4px",
              background:
                "linear-gradient(90deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
              borderRadius: "2px",
              marginBottom: "40px",
            }}
          />

          {/* Session Details Card */}
          <Section
            style={{
              backgroundColor: "#FAFAFA",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "32px",
              border: "1px solid #F3F4F6",
            }}
          >
            <Heading
              as="h2"
              style={{
                fontSize: "20px",
                lineHeight: "28px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 24px 0",
                letterSpacing: "-0.3px",
              }}
            >
              {t.sessionDetails}
            </Heading>

            {/* Lesson Topic - Highlighted */}
            <Section style={{ marginBottom: "20px" }}>
              <Text
                style={{
                  fontSize: "12px",
                  lineHeight: "16px",
                  color: "#6B7280",
                  fontWeight: "500",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: "6px",
                }}
              >
                {t.topic}
              </Text>
              <Text
                style={{
                  fontSize: "18px",
                  lineHeight: "28px",
                  color: "#111827",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                {sessionType}
              </Text>
            </Section>

            {/* Details Grid */}
            <Section>
              <Row style={{ marginBottom: "16px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#6B7280",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {t.date}
                  </Text>
                </Column>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{
                      fontSize: "15px",
                      lineHeight: "24px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {formattedDate}
                  </Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: "16px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#6B7280",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {t.duration}
                  </Text>
                </Column>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{
                      fontSize: "15px",
                      lineHeight: "24px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {duration} {t.minutes}
                  </Text>
                </Column>
              </Row>

              <Row>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "13px",
                      lineHeight: "20px",
                      color: "#6B7280",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {t.teacher}
                  </Text>
                </Column>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{
                      fontSize: "15px",
                      lineHeight: "24px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {tutorName}
                  </Text>
                </Column>
              </Row>
            </Section>
          </Section>

          {/* Video Call Section - only shown when a video call URL has been set */}
          {videoCallUrl && (
            <Section
              style={{
                backgroundColor: "#FAFAFA",
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px",
                border: "1px solid #F3F4F6",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  fontWeight: "600",
                  color: "#111827",
                  margin: "0 0 16px 0",
                }}
              >
                {t.videoCall}
              </Text>
              <Button
                href={videoCallUrl}
                style={{
                  background:
                    "linear-gradient(135deg, #6089CB 0%, #A855F7 100%)",
                  color: "#FFFFFF",
                  padding: "14px 32px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: "600",
                  textDecoration: "none",
                  display: "inline-block",
                  border: "none",
                  cursor: "pointer",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                {t.joinSession}
              </Button>
              <Text
                style={{
                  fontSize: "13px",
                  lineHeight: "20px",
                  color: "#6B7280",
                  margin: "16px 0 0 0",
                }}
              >
                <Link
                  href={videoCallUrl}
                  style={{
                    color: "#6B7280",
                    textDecoration: "underline",
                  }}
                >
                  {videoCallUrl}
                </Link>
              </Text>
            </Section>
          )}

          {/* Personal Message */}
          <Section
            style={{
              textAlign: "center",
              marginTop: "40px",
              paddingTop: "32px",
              borderTop: "1px solid #F3F4F6",
            }}
          >
            <Text
              style={{
                fontSize: "17px",
                lineHeight: "28px",
                color: "#374151",
                fontWeight: "500",
                margin: "0",
              }}
            >
              {t.seeYouSoon}, {name}! ✨
            </Text>
          </Section>
        </Container>

        {/* Footer */}
        <Section style={{ padding: "40px 32px", textAlign: "center" }}>
          <Row>
            <Column align="center">
              <table style={{ margin: "0 auto" }}>
                <tr>
                  <td style={{ padding: "0 12px" }}>
                    <Link
                      href={`https://www.slovenscinakzk.com/${locale}/dashboard`}
                      style={{
                        color: "#6B7280",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {t.dashboard}
                    </Link>
                  </td>
                  <td style={{ padding: "0 12px" }}>
                    <Link
                      href={`https://www.slovenscinakzk.com/${locale}/about-us`}
                      style={{
                        color: "#6B7280",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {t.about}
                    </Link>
                  </td>
                  <td style={{ padding: "0 12px" }}>
                    <Link
                      href={`https://www.slovenscinakzk.com/${locale}/pricing`}
                      style={{
                        color: "#6B7280",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {t.pricing}
                    </Link>
                  </td>
                  <td style={{ padding: "0 12px" }}>
                    <Link
                      href="mailto:support@slovenscinakzk.com"
                      style={{
                        color: "#6B7280",
                        textDecoration: "none",
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {t.contact}
                    </Link>
                  </td>
                </tr>
              </table>
            </Column>
          </Row>
          <Text
            style={{
              marginTop: "24px",
              fontSize: "13px",
              lineHeight: "20px",
              color: "#9CA3AF",
              marginBottom: "0",
            }}
          >
            &copy; {year} Slovenščina Korak za Korakom, {t.allRightsReserved}
          </Text>
        </Section>

        {/* Bottom Spacer */}
        <Section style={{ paddingBottom: "40px" }} />
      </Container>
    </>
  );
};

export default SessionConfEmailContent;

