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
      cancellation: "Potrditev preklica",
      subtitleLanguageClub: "Vaša rezervacija za pogovorni klub je preklicana.",
      subtitlePersonalSession: "Vaša osebna lekcija je preklicana.",
      cancelledDetails: "Podrobnosti preklicane rezervacije",
      lessonDetails: "Podrobnosti lekcije",
      sessionDetails: "Podrobnosti seje",
      date: "Datum",
      time: "Čas",
      duration: "Trajanje",
      teacher: "Tutor",
      tutor: "Tutor",
      lessonTheme: "Tip lekcije",
      topic: "Tema lekcije",
      location: "Lokacija",
      description: "Opis",
      level: "Nivo",
      type: "Pogovorni klub",
      weUnderstand: "Razumemo",
      cancellationMessage:
        "Razumemo, da se načrti spremenijo. Upamo, da se boste kmalu spet pridružili nam!",
      thankYou: "Hvala",
      bookAnother: "Rezervirajte drugo lekcijo",
      dashboard: "Dashboard",
      about: "O nas",
      pricing: "Cenik",
      contact: "Kontakt",
      allRightsReserved: "Vse pravice pridržane",
      minutes: "minut",
    },
    en: {
      cancellation: "Cancellation Confirmation",
      subtitleLanguageClub: "Your language club booking has been cancelled.",
      subtitlePersonalSession: "Your personal session has been cancelled.",
      cancelledDetails: "Cancelled Booking Details",
      lessonDetails: "Lesson Details",
      sessionDetails: "Session Details",
      date: "Date",
      time: "Time",
      duration: "Duration",
      teacher: "Teacher",
      tutor: "Tutor",
      lessonTheme: "Lesson Type",
      topic: "Lesson Topic",
      location: "Location",
      description: "Description",
      level: "Level",
      type: "Language club",
      weUnderstand: "We Understand",
      cancellationMessage:
        "We understand that plans change. We hope to see you again soon!",
      thankYou: "Thank you",
      bookAnother: "Book Another Session",
      dashboard: "Dashboard",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      allRightsReserved: "All Rights Reserved",
      minutes: "minutes",
    },
    it: {
      cancellation: "Conferma Cancellazione",
      subtitleLanguageClub: "La tua prenotazione per il club della lingua è stata cancellata.",
      subtitlePersonalSession: "La tua sessione personale è stata cancellata.",
      cancelledDetails: "Dettagli Prenotazione Cancellata",
      lessonDetails: "Dettagli Lezione",
      sessionDetails: "Dettagli Sessione",
      date: "Data",
      time: "Ora",
      duration: "Durata",
      teacher: "Insegnante",
      tutor: "Tutor",
      lessonTheme: "Tipo di Lezione",
      topic: "Argomento Lezione",
      location: "Luogo",
      description: "Descrizione",
      level: "Livello",
      type: "Club della Lingua",
      weUnderstand: "Capiamo",
      cancellationMessage:
        "Capiamo che i piani cambiano. Speriamo di rivederti presto!",
      thankYou: "Grazie",
      bookAnother: "Prenota un'altra Sessione",
      dashboard: "Dashboard",
      about: "Chi siamo",
      pricing: "Prezzi",
      contact: "Contatto",
      allRightsReserved: "Tutti i diritti riservati",
      minutes: "minuti",
    },
    ru: {
      cancellation: "Подтверждение отмены",
      subtitleLanguageClub: "Ваше бронирование языкового клуба отменено.",
      subtitlePersonalSession: "Ваше занятие отменено.",
      cancelledDetails: "Детали отмененного бронирования",
      lessonDetails: "Детали урока",
      sessionDetails: "Детали сессии",
      date: "Дата",
      time: "Время",
      duration: "Продолжительность",
      teacher: "Учитель",
      tutor: "Учитель",
      lessonTheme: "Тип урока",
      topic: "Тема урока",
      location: "Место",
      description: "Описание",
      level: "Уровень",
      type: "языковой-клуб",
      weUnderstand: "Мы понимаем",
      cancellationMessage:
        "Мы понимаем, что планы меняются. Надеемся увидеть вас снова в ближайшее время!",
      thankYou: "Спасибо",
      bookAnother: "Забронировать другую сессию",
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

const CancellationConfEmailContent = ({
  name,
  locale,
  eventType,
  // Language Club
  lessonDate,
  lessonDuration,
  teacherName,
  lessonTheme,
  // lessonLocation,
  lessonDescription,
  lessonLevel,
  // Personal Session
  startTime,
  duration,
  tutorName,
  sessionType,
  // location,
}: {
  name: string;
  locale: string;
  eventType: "language-club" | "personal-session";
  lessonDate?: Date;
  lessonDuration?: number;
  teacherName?: string;
  lessonTheme?: string;
  lessonLocation?: string;
  lessonDescription?: string;
  lessonLevel?: string;
  startTime?: Date;
  duration?: number;
  tutorName?: string;
  sessionType?: string;
  location?: string;
}) => {
  const year = new Date().getFullYear();
  const t = getEmailTranslations(locale);

  // Format date based on event type
  const formattedDate = eventType === "language-club" && lessonDate
    ? toZonedTime(lessonDate, "Europe/Ljubljana").toLocaleDateString(
        locale,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )
    : startTime
      ? toZonedTime(startTime, "Europe/Ljubljana").toLocaleDateString(
          locale,
          {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }
        )
      : "";

  const displayDuration =
    eventType === "language-club"
      ? lessonDuration
      : duration;

  const displayTeacher =
    eventType === "language-club" ? teacherName : tutorName;

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
                {t.cancellation}
              </Heading>
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#6B7280",
                  margin: "0",
                }}
              >
                {eventType === "language-club"
                  ? t.subtitleLanguageClub
                  : t.subtitlePersonalSession}
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

          {/* Cancelled Details Card */}
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
              {t.cancelledDetails}
            </Heading>

            {/* Event Type - Highlighted */}
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
                {eventType === "language-club"
                  ? t.lessonTheme
                  : t.topic}
                {eventType === "language-club" && ` - ${t.type}`}
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
                {eventType === "language-club"
                  ? lessonTheme
                  : sessionType}
              </Text>
            </Section>

            {/* Description for Language Club */}
            {eventType === "language-club" && lessonDescription && (
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
                  {lessonDescription}
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
                    {displayDuration}{" "}
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
                    {eventType === "language-club" ? t.teacher : t.tutor}
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
                    {displayTeacher}
                  </Text>
                </Column>
              </Row>

              {/* Level for Language Club only */}
              {eventType === "language-club" && lessonLevel && (
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
                      {lessonLevel}
                    </Text>
                  </Column>
                </Row>
              )}
            </Section>
          </Section>

          {/* Understanding Message */}
          <Section
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "32px",
              borderLeft: "4px solid #A855F7",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "18px",
                lineHeight: "28px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              {t.weUnderstand}
            </Text>
            <Text
              style={{
                fontSize: "15px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: "0",
              }}
            >
              {t.cancellationMessage}
            </Text>
          </Section>

          {/* CTA Button */}
          <Section style={{ textAlign: "center", marginBottom: "32px" }}>
            <Link
              href={`https://www.slovenscinakzk.com/${locale}/dashboard`}
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
                fontFamily:
                  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                WebkitTextFillColor: "#FFFFFF",
              }}
            >
              {t.bookAnother}
            </Link>
          </Section>

          {/* Personal Message */}
          <Section
            style={{
              textAlign: "center",
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
              {t.thankYou}, {name}! ✨
            </Text>
          </Section>
        </Container>

        {/* Footer */}
        <Section style={{ padding: "40px 32px", textAlign: "center" }}>
          <Row>
            <Column align="center">
              <table style={{ margin: "0 auto" }}>
                <tbody>
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
                </tbody>
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

export default CancellationConfEmailContent;

