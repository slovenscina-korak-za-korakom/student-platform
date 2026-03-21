import {
  Img,
  Column,
  Container,
  Row,
  Section,
  Heading,
  Text,
  Link,
} from "@react-email/components";
import { toZonedTime } from "date-fns-tz";
import React from "react";

// Simple translation function for emails
const getEmailTranslations = (locale: string) => {
  const translations = {
    sl: {
      reschedule: "Ponovna rezervacija",
      subtitle: "Vaša rezervacija za pogovorni klub je bila uspešno spremenjena!",
      oldBooking: "Prejšnja rezervacija",
      newBooking: "Nova rezervacija",
      lessonDetails: "Podrobnosti lekcije",
      date: "Datum",
      time: "Čas",
      duration: "Trajanje",
      teacher: "Tutor",
      lessonTheme: "Tip lekcije",
      location: "Lokacija",
      description: "Opis",
      level: "Nivo",
      type: "Pogovorni klub",
      seeYouSoon: "Vidimo se kmalu",
      dashboard: "Dashboard",
      about: "O nas",
      pricing: "Cenik",
      contact: "Kontakt",
      allRightsReserved: "Vse pravice pridržane",
    },
    en: {
      reschedule: "Reschedule Confirmation",
      subtitle: "Your language club booking has been successfully rescheduled!",
      oldBooking: "Previous Booking",
      newBooking: "New Booking",
      lessonDetails: "Lesson Details",
      date: "Date",
      time: "Time",
      duration: "Duration",
      teacher: "Teacher",
      lessonTheme: "Lesson Type",
      location: "Location",
      description: "Description",
      level: "Level",
      type: "Language club",
      seeYouSoon: "See you soon",
      dashboard: "Dashboard",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      allRightsReserved: "All Rights Reserved",
    },
    it: {
      reschedule: "Conferma Riprogrammazione",
      subtitle: "La tua prenotazione per il club della lingua è stata riprogrammata con successo!",
      oldBooking: "Prenotazione Precedente",
      newBooking: "Nuova Prenotazione",
      lessonDetails: "Dettagli Lezione",
      date: "Data",
      time: "Ora",
      duration: "Durata",
      teacher: "Insegnante",
      lessonTheme: "Tipo di Lezione",
      location: "Luogo",
      description: "Descrizione",
      level: "Livello",
      type: "Club della Lingua",
      seeYouSoon: "A presto",
      dashboard: "Dashboard",
      about: "Chi siamo",
      pricing: "Prezzi",
      contact: "Contatto",
      allRightsReserved: "Tutti i diritti riservati",
    },
    ru: {
      reschedule: "Подтверждение переноса",
      subtitle: "Ваше бронирование разговорного клуба успешно перенесено!",
      oldBooking: "Предыдущее бронирование",
      newBooking: "Новое бронирование",
      lessonDetails: "Детали урока",
      date: "Дата",
      time: "Время",
      duration: "Продолжительность",
      teacher: "Учитель",
      lessonTheme: "Тип урока",
      location: "Место",
      description: "Описание",
      level: "Уровень",
      type: "Разговорный клуб",
      seeYouSoon: "До скорой встречи",
      dashboard: "Dashboard",
      about: "О нас",
      pricing: "Цены",
      contact: "Контакты",
      allRightsReserved: "Все права защищены",
    },
  };

  return translations[locale as keyof typeof translations] || translations.en;
};

const RescheduleConfEmailContent = ({
  name,
  locale,
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
}: {
  name: string;
  locale: string;
  oldLessonDate: Date;
  oldLessonDuration: number;
  oldTeacherName: string;
  oldLessonTheme: string;
  oldLessonLocation: string;
  oldLessonDescription?: string;
  oldLessonLevel?: string;
  newLessonDate: Date;
  newLessonDuration: number;
  newTeacherName: string;
  newLessonTheme: string;
  newLessonLocation: string;
  newLessonDescription?: string;
  newLessonLevel?: string;
}) => {
  const year = new Date().getFullYear();
  const t = getEmailTranslations(locale);

  // Format dates for display
  const formattedOldDate = toZonedTime(
    oldLessonDate,
    "Europe/Ljubljana",
  ).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const formattedNewDate = toZonedTime(
    newLessonDate,
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
                {t.reschedule}
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

          {/* Old Booking Details Card */}
          <Section
            style={{
              backgroundColor: "#FAFAFA",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "24px",
              border: "1px solid #F3F4F6",
            }}
          >
            <Heading
              as="h2"
              style={{
                fontSize: "18px",
                lineHeight: "24px",
                fontWeight: "600",
                color: "#6B7280",
                margin: "0 0 24px 0",
                letterSpacing: "-0.2px",
              }}
            >
              {t.oldBooking}
            </Heading>

            {/* Lesson Type */}
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
                {t.lessonTheme} - {t.type}
              </Text>
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#111827",
                  fontWeight: "600",
                  margin: "0",
                }}
              >
                {oldLessonTheme}
              </Text>
            </Section>

            {/* Description */}
            {oldLessonDescription && (
              <Section
                style={{
                  marginBottom: "20px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
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
                  {t.description}
                </Text>
                <Text
                  style={{
                    fontSize: "14px",
                    lineHeight: "20px",
                    color: "#374151",
                    margin: "0",
                  }}
                >
                  {oldLessonDescription}
                </Text>
              </Section>
            )}

            {/* Details Grid */}
            <Section>
              <Row style={{ marginBottom: "12px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
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
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {formattedOldDate}
                  </Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: "12px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
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
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {oldLessonDuration}{" "}
                    {locale === "sl"
                      ? "minut"
                      : locale === "it"
                        ? "minuti"
                        : locale === "ru"
                          ? "минут"
                          : "minutes"}
                  </Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: "12px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
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
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {oldTeacherName}
                  </Text>
                </Column>
              </Row>

              <Row style={{ marginBottom: "12px" }}>
                <Column style={{ width: "40%" }}>
                  <Text
                    style={{
                      fontSize: "12px",
                      lineHeight: "18px",
                      color: "#6B7280",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {t.location}
                  </Text>
                </Column>
                <Column style={{ width: "60%" }}>
                  <Text
                    style={{
                      fontSize: "14px",
                      lineHeight: "20px",
                      color: "#111827",
                      fontWeight: "500",
                      margin: "0",
                    }}
                  >
                    {oldLessonLocation}
                  </Text>
                </Column>
              </Row>

              {oldLessonLevel && (
                <Row>
                  <Column style={{ width: "40%" }}>
                    <Text
                      style={{
                        fontSize: "12px",
                        lineHeight: "18px",
                        color: "#6B7280",
                        fontWeight: "500",
                        margin: "0",
                      }}
                    >
                      {t.level}
                    </Text>
                  </Column>
                  <Column style={{ width: "60%" }}>
                    <Text
                      style={{
                        fontSize: "14px",
                        lineHeight: "20px",
                        color: "#111827",
                        fontWeight: "500",
                        margin: "0",
                      }}
                    >
                      {oldLessonLevel}
                    </Text>
                  </Column>
                </Row>
              )}
            </Section>
          </Section>

          {/* Arrow/Divider */}
          <Section style={{ textAlign: "center", marginBottom: "24px" }}>
            <Text
              style={{
                fontSize: "24px",
                lineHeight: "32px",
                color: "#A855F7",
                margin: "0",
              }}
            >
              ↓
            </Text>
          </Section>

          {/* New Booking Details Card */}
          <Section
            style={{
              backgroundColor: "#FAFAFA",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "32px",
              border: "2px solid #A855F7",
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
              {t.newBooking}
            </Heading>

            {/* Lesson Type - Highlighted */}
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
                {t.lessonTheme} - {t.type}
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
                {newLessonTheme}
              </Text>
            </Section>

            {/* Description */}
            {newLessonDescription && (
              <Section
                style={{
                  marginBottom: "20px",
                  paddingBottom: "20px",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
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
                  {t.description}
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "#374151",
                    margin: "0",
                  }}
                >
                  {newLessonDescription}
                </Text>
              </Section>
            )}

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
                    {formattedNewDate}
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
                    {newLessonDuration}{" "}
                    {locale === "sl"
                      ? "minut"
                      : locale === "it"
                        ? "minuti"
                        : locale === "ru"
                          ? "минут"
                          : "minutes"}
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
                    {newTeacherName}
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
                    {t.location}
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
                    {newLessonLocation}
                  </Text>
                </Column>
              </Row>

              {newLessonLevel && (
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
                      {t.level}
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
                      {newLessonLevel}
                    </Text>
                  </Column>
                </Row>
              )}
            </Section>
          </Section>

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

export default RescheduleConfEmailContent;

