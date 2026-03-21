import {
  Img,
  Column,
  Container,
  Row,
  Section,
  Heading,
  Button,
  Text,
  Link,
} from "@react-email/components";
import React from "react";

// Simple translation function for emails
const getEmailTranslations = (locale: string) => {
  const translations = {
    sl: {
      welcome: "Dobrodošli",
      subtitle:
        "Dobrodošli pri Slovenščini Korak za Korakom. Veseli smo, da ste izbrali nas!",
      getStarted: "Začnite zdaj!",
      whatsNext: "Kaj je naslednje?",
      whatsNextDesc:
        "Vaša pot do tekoče slovenščine se začenja. Evo, kako lahko izkoristite najboljše iz vaše izkušnje.",
      feature1Title: "Osebne lekcije",
      feature1Desc:
        "Rezervirajte individualne lekcije z izkušenimi tutorji, prilagojene vašemu tempu in ciljem.",
      feature2Title: "Pogovorni klub",
      feature2Desc:
        "Pridružite se našemu pogovornemu klubu in vadite slovenščino v prijetni in podporni skupnosti.",
      feature3Title: "Osebno prilagojeno učenje",
      feature3Desc:
        "Naš pristop se prilagaja vašim potrebam, kar vam omogoča napredek v svojem tempu.",
      tipTitle: "Nasvet za začetek",
      tipText:
        "Za najboljše rezultate priporočamo, da začnete s svojo prvo lekcijo v naslednjih 7 dneh. To vam bo pomagalo vzpostaviti dobre navade učenja.",
      needHelp: "Potrebujete pomoč?",
      needHelpDesc:
        "Naša ekipa je vedno na voljo, da vam pomaga. Ne oklevajte, če imate vprašanja.",
      contactUs: "Kontaktirajte nas",
      dashboard: "Dashboard",
      about: "O nas",
      pricing: "Cenik",
      contact: "Kontakt",
      allRightsReserved: "Vse pravice pridržane",
    },
    en: {
      welcome: "Welcome",
      subtitle:
        "Welcome to our Slovene learning community. We're excited to have you on board!",
      getStarted: "Get Started Now!",
      whatsNext: "What's Next?",
      whatsNextDesc:
        "Your journey to fluent Slovene starts here. Here's how you can make the most of your experience.",
      feature1Title: "Personal Lessons",
      feature1Desc:
        "Book one-on-one lessons with experienced tutors, tailored to your pace and goals.",
      feature2Title: "Language Club",
      feature2Desc:
        "Join our conversation club and practice Slovene in a friendly and supportive community.",
      feature3Title: "Personalized Learning",
      feature3Desc:
        "Our approach adapts to your needs, allowing you to progress at your own pace.",
      tipTitle: "Getting Started Tip",
      tipText:
        "For best results, we recommend booking your first lesson within the next 7 days. This will help you establish good learning habits.",
      needHelp: "Need Help?",
      needHelpDesc:
        "Our team is always here to assist you. Don't hesitate to reach out if you have any questions.",
      contactUs: "Contact Us",
      dashboard: "Dashboard",
      about: "About",
      pricing: "Pricing",
      contact: "Contact",
      allRightsReserved: "All Rights Reserved",
    },
    it: {
      welcome: "Benvenuto",
      subtitle:
        "Benvenuti nella nostra comunità di studio slovena. Siamo entusiasti di avervi a bordo!",
      getStarted: "Inizia!",
      whatsNext: "Cosa c'è dopo?",
      whatsNextDesc:
        "Il tuo viaggio verso lo sloveno fluente inizia qui. Ecco come puoi sfruttare al meglio la tua esperienza.",
      feature1Title: "Lezioni Personalizzate",
      feature1Desc:
        "Prenota lezioni individuali con tutor esperti, personalizzate secondo il tuo ritmo e i tuoi obiettivi.",
      feature2Title: "Club della Lingua",
      feature2Desc:
        "Unisciti al nostro club di conversazione e pratica lo sloveno in una comunità amichevole e di supporto.",
      feature3Title: "Apprendimento Personalizzato",
      feature3Desc:
        "Il nostro approccio si adatta alle tue esigenze, permettendoti di progredire al tuo ritmo.",
      tipTitle: "Consiglio per Iniziare",
      tipText:
        "Per i migliori risultati, ti consigliamo di prenotare la tua prima lezione entro i prossimi 7 giorni. Questo ti aiuterà a stabilire buone abitudini di apprendimento.",
      needHelp: "Hai Bisogno di Aiuto?",
      needHelpDesc:
        "Il nostro team è sempre qui per assisterti. Non esitare a contattarci se hai domande.",
      contactUs: "Contattaci",
      dashboard: "Dashboard",
      about: "Chi siamo",
      pricing: "Prezzi",
      contact: "Contatto",
      allRightsReserved: "Tutti i diritti riservati",
    },
    ru: {
      welcome: "Добро пожаловать",
      subtitle:
        "Добро пожаловать в наше сообщество по изучению словенского языка. Мы рады видеть вас в наших рядах!",
      getStarted: "Начать сейчас!",
      whatsNext: "Что дальше?",
      whatsNextDesc:
        "Ваш путь к свободному владению словенским языком начинается здесь. Вот как вы можете максимально использовать свой опыт.",
      feature1Title: "Персональные уроки",
      feature1Desc:
        "Забронируйте индивидуальные уроки с опытными преподавателями, адаптированные под ваш темп и цели.",
      feature2Title: "Разговорный клуб",
      feature2Desc:
        "Присоединяйтесь к нашему разговорному клубу и практикуйте словенский в дружелюбном и поддерживающем сообществе.",
      feature3Title: "Персонализированное обучение",
      feature3Desc:
        "Наш подход адаптируется к вашим потребностям, позволяя вам прогрессировать в своем темпе.",
      tipTitle: "Совет для начала",
      tipText:
        "Для лучших результатов мы рекомендуем забронировать ваш первый бесплатный пробный урок в течение следующих 7 дней. Это поможет нам подобрать правильный подход к обучению.",
      needHelp: "Нужна помощь?",
      needHelpDesc:
        "Наша команда всегда готова помочь вам. Не стесняйтесь обращаться, если у вас есть вопросы.",
      contactUs: "Связаться с нами",
      dashboard: "Dashboard",
      about: "О нас",
      pricing: "Цены",
      contact: "Контакты",
      allRightsReserved: "Все права защищены",
    },
  };

  return translations[locale as keyof typeof translations] || translations.en;
};

const WelcomeEmailContent = ({
  name,
  locale,
}: {
  name: string;
  locale: string;
}) => {
  const year = new Date().getFullYear();
  const t = getEmailTranslations(locale);

  return (
    <>
      {/* Main Container with max-width for a modern look */}
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
                {t.welcome}, {name}!
              </Heading>
              <Text
                style={{
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#6B7280",
                  margin: "0 0 32px 0",
                }}
              >
                {t.subtitle}
              </Text>

              {/* Purple-Blue-Pink Gradient Accent Line */}
              <Section
                style={{
                  height: "4px",
                  background:
                    "linear-gradient(90deg, #6089CB 0%, #A855F7 50%, #F9A8D4 100%)",
                  borderRadius: "2px",
                  marginBottom: "32px",
                }}
              />

              {/* CTA Button with Gradient */}
              <Button
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
                  border: "none",
                  cursor: "pointer",
                  fontFamily:
                    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
                  WebkitTextFillColor: "#FFFFFF",
                }}
              >
                {t.getStarted}
              </Button>
            </Section>
          </Section>

          {/* What's Next Section */}
          <Section style={{ marginTop: "48px", marginBottom: "40px" }}>
            <Heading
              as="h2"
              style={{
                fontSize: "24px",
                lineHeight: "32px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0",
                letterSpacing: "-0.3px",
              }}
            >
              {t.whatsNext}
            </Heading>
            <Text
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: "0 0 32px 0",
              }}
            >
              {t.whatsNextDesc}
            </Text>

            {/* Features Grid */}
            <Section>
              {/* Feature 1 */}
              <Section
                style={{
                  backgroundColor: "#FAFAFA",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "16px",
                  border: "1px solid #F3F4F6",
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
                  {t.feature1Title}
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  {t.feature1Desc}
                </Text>
              </Section>

              {/* Feature 2 */}
              <Section
                style={{
                  backgroundColor: "#FAFAFA",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "16px",
                  border: "1px solid #F3F4F6",
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
                  {t.feature2Title}
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  {t.feature2Desc}
                </Text>
              </Section>

              {/* Feature 3 */}
              <Section
                style={{
                  backgroundColor: "#FAFAFA",
                  borderRadius: "12px",
                  padding: "24px",
                  marginBottom: "0",
                  border: "1px solid #F3F4F6",
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
                  {t.feature3Title}
                </Text>
                <Text
                  style={{
                    fontSize: "15px",
                    lineHeight: "24px",
                    color: "#6B7280",
                    margin: "0",
                  }}
                >
                  {t.feature3Desc}
                </Text>
              </Section>
            </Section>
          </Section>

          {/* Tip Section */}
          <Section
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: "16px",
              padding: "24px",
              marginTop: "40px",
              marginBottom: "40px",
              borderLeft: "4px solid #A855F7",
            }}
          >
            <Text
              style={{
                fontSize: "14px",
                lineHeight: "20px",
                fontWeight: "600",
                color: "#6B7280",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                margin: "0 0 8px 0",
              }}
            >
              {t.tipTitle}
            </Text>
            <Text
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "#374151",
                margin: "0",
              }}
            >
              {t.tipText}
            </Text>
          </Section>

          {/* Need Help Section */}
          <Section
            style={{
              textAlign: "center",
              paddingTop: "32px",
              borderTop: "1px solid #F3F4F6",
            }}
          >
            <Text
              style={{
                fontSize: "20px",
                lineHeight: "28px",
                fontWeight: "600",
                color: "#111827",
                margin: "0 0 8px 0",
              }}
            >
              {t.needHelp}
            </Text>
            <Text
              style={{
                fontSize: "15px",
                lineHeight: "24px",
                color: "#6B7280",
                margin: "0 0 24px 0",
              }}
            >
              {t.needHelpDesc}
            </Text>
            <Link
              href="mailto:support@slovenscinakzk.com"
              style={{
                color: "#A855F7",
                textDecoration: "none",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              {t.contactUs} →
            </Link>
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

export default WelcomeEmailContent;
