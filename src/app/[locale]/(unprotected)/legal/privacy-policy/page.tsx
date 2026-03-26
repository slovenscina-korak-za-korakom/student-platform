import "../legal.css";
import {Metadata} from "next";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Privacy Policy",
    description: "Privacy Policy for Slovenščina Korak za Korkom. Learn how we collect, use, and protect your personal data in compliance with GDPR.",
    alternates: getAlternates("/legal/privacy-policy", locale),
  };
}

const PrivacyPolicyPage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mb-16">
      <section>
        <h1>PRIVACY POLICY</h1>
        <p>Last Updated: 1st January 2025</p>
        <p>
          Welcome to Slovenščina Korak za Korkom! Your privacy is important to us. This
          Privacy Policy explains how we collect, use, and protect your personal
          data when you use our website and services. It also outlines your
          rights under GDPR and other applicable laws.
        </p>
        <p>
          By using our website and services, you agree to the collection and use
          of information as described in this policy. If you do not agree,
          please refrain from using our services.
        </p>
      </section>
      <section>
        <h2>1. INTRODUCTION</h2>
        <p>
          Slovenščina Korak za Korkom (“Company,” “we,” “us,” or “our”) provides online
          language learning services. We are committed to protecting your
          personal data and ensuring transparency in how we handle it.
        </p>
        <p>
          This policy applies to our website, services, and any interactions you
          have with us.
        </p>
      </section>
      <section>
        <h2>2. INFORMATION WE COLLECT</h2>
        <p>
          We collect different types of data to provide and improve our
          services.
        </p>
        <h3>2.1. Information You Provide to Us</h3>

        <ul>
          <li>
            Personal Information: Name, email address, phone number, and payment
            details.
          </li>
          <li>Account Details: Username, password, and profile information.</li>
          <li>
            Learning Preferences: Your language learning goals and experience
            level.
          </li>
          <li>
            Messages & Feedback: Any communication you send to us, such as
            emails or reviews.
          </li>
        </ul>

        <h3>2.2. Information We Collect Automatically</h3>
        <ul>
          <li>
            Usage Data: Pages visited, time spent on our website, and
            interaction data.
          </li>
          <li>
            Device & Browser Data: IP address, browser type, and operating
            system.
          </li>
          <li>
            Cookies & Tracking Technologies: We use cookies to improve user
            experience and track site usage.
          </li>
        </ul>
        <h3>2.3. Information from Third Parties</h3>
        <p>
          We may receive data from third-party payment processors, analytics
          providers, and social media platforms (if you interact with our
          content there).
        </p>
      </section>
      <section>
        <h2>3. HOW WE USE YOUR INFORMATION</h2>
        <p>We process your personal data for the following purposes:</p>
        <ul>
          <li>
            Providing Services: Delivering lessons, processing payments, and
            managing your account.
          </li>
          <li>
            Personalization: Customizing lessons based on your learning
            preferences.
          </li>
          <li>
            Customer Support: Responding to inquiries and resolving issues.
          </li>
          <li>
            Marketing & Promotions: Sending relevant offers and updates (you can
            opt out).
          </li>
          <li>
            Security & Fraud Prevention: Detecting unauthorized activities and
            protecting users.
          </li>
          <li>
            Legal Compliance: Meeting legal obligations and responding to law
            enforcement requests.
          </li>
        </ul>
        <p>
          We process your data based on legitimate interest, contractual
          necessity, legal obligations, and consent (where applicable).
        </p>
      </section>
      <section>
        <h2>4. LEGAL BASIS FOR PROCESSING (GDPR Compliance)</h2>
        <p>
          If you are in the European Economic Area (EEA), we process your data
          under the following legal bases:
        </p>
        <ul>
          <li>Consent: When you opt-in to receive marketing emails.</li>
          <li>
            Contractual Necessity: To provide the services you signed up for.
          </li>
          <li>
            Legitimate Interests: For analytics, security, and improving user
            experience.
          </li>
          <li>
            Legal Obligation: When complying with financial, tax, or legal
            regulations.
          </li>
        </ul>
        You have the right to withdraw consent at any time.
      </section>
      <section>
        <h2>5. HOW WE SHARE YOUR INFORMATION</h2>
        <p>
          We do not sell or rent your personal data. However, we may share your
          information with:
        </p>
        <ul>
          <li>
            Service Providers: Third-party companies for hosting, payments,
            analytics, and customer support.
          </li>
          <li>
            Legal Authorities: When required by law, such as in response to a
            court order.
          </li>
          <li>
            Business Transfers: In case of a merger, acquisition, or sale of
            assets.
          </li>
        </ul>
        <p>
          All third-party service providers are required to safeguard your data
          and use it only for the specified purposes.
        </p>

        <h3>5.1. Clerk Authentication</h3>
        <p>
          We use Clerk Auth to manage authentication and user accounts. Clerk
          handles login, account creation, and security.
        </p>
        <p>
          For details on how Clerk processes your data, please refer to the{" "}
          <a href="https://clerk.com/legal/privacy">
            Clerk&apos;s Privacy Policy.
          </a>
        </p>
      </section>
      <section>
        <h2>6. DATA RETENTION</h2>
        <p>
          We retain your personal data only as long as necessary for the
          purposes described in this policy.
        </p>
        <ul>
          <li>
            Account Information: Stored as long as your account is active.
          </li>
          <li>
            Payment Information: Retained for financial and legal compliance.
          </li>
          <li>Marketing Data: Retained until you opt out.</li>
        </ul>

        <p>
          If you request deletion of your account, we will remove your personal
          data, except where we must retain it for legal reasons.
        </p>
      </section>
      <section>
        <h2>7. YOUR RIGHTS UNDER GDPR</h2>

        <p>If you are in the EEA, you have the following rights:</p>
        <ul>
          <li>
            <strong>Access: </strong>
            Request a copy of your personal data.
          </li>
          <li>
            <strong>Correction: </strong>
            Ask us to correct inaccurate or incomplete data.
          </li>
          <li>
            <strong>Deletion (Right to be Forgotten): </strong>
            Request the deletion of your data.
          </li>
          <li>
            <strong>Restriction: </strong>
            Limit how we process your data.
          </li>
          <li>
            <strong>Portability: </strong>
            Request a copy of your data in a structured format.
          </li>
          <li>
            <strong>Objection: </strong>
            Object to processing based on legitimate interests or direct
            marketing.
          </li>
          <li>
            <strong>Withdraw Consent: </strong>
            If processing is based on consent, you can withdraw it at any time.
          </li>
        </ul>
        <p>
          To exercise these rights, contact us at{" "}
          <a href="mailto:sebastjan.bas@gmail.com?cc=almn140803@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.></p>">
            support@slovene-step-by-step.com
          </a>
          . We will respond within 7 days.
        </p>
      </section>
      <section>
        <h2>8. COOKIES & TRACKING TECHNOLOGIES</h2>
        <p>We use cookies to enhance your experience.</p>

        <h3>8.1. What Are Cookies?</h3>
        <p>
          Cookies are small files stored on your device to remember your
          preferences and track website activity.
        </p>

        <h3>8.2. Types of Cookies We Use</h3>
        <ul>
          <li>Essential Cookies: Required for website functionality.</li>
          <li>
            Analytics Cookies: Help us analyze website traffic and improve
            services.
          </li>
          <li>Marketing Cookies: Used for advertising and personalization.</li>
        </ul>

        <h3>8.3. Managing Cookies</h3>
        <p>
          You can disable cookies in your browser settings, but some features
          may not work properly.
        </p>
      </section>
      <section>
        <h2>9. SECURITY MEASURES</h2>
        <p>We implement strong security measures, including:</p>
        <ul>
          <li>Encryption: Secure transmission of sensitive data.</li>
          <li>
            Access Controls: Limited access to personal data by authorized staff
            only.
          </li>
          <li>Regular Audits: Ongoing security reviews and updates.</li>
        </ul>
        <p>
          However, no online service is 100% secure. We encourage you to use
          strong passwords and be cautious online.
        </p>
      </section>
      <section>
        <h2>10. THIRD-PARTY LINKS</h2>

        <p>
          Our website may contain links to third-party websites. We are not
          responsible for their privacy practices, so we encourage you to review
          their policies before providing any information.
        </p>
      </section>
      <section>
        <h2>11. CHILDREN&apos;S PRIVACY</h2>
        <p>
          Our services are not intended for children under 13. If we discover
          that we have collected personal data from a child without parental
          consent, we will delete it immediately.
        </p>
      </section>
      <section>
        <h2>12. INTERNATIONAL DATA TRANSFER</h2>
        <p>
          If you are outside the EEA, your data may be transferred to countries
          with different data protection laws.
        </p>
        <p>
          We ensure that international transfers comply with GDPR and use
          Standard Contractual Clauses (SCCs) where necessary.
        </p>
      </section>
      <section>
        <h2>13. CHANGES TO THIS PRIVACY POLICY</h2>
        <p>
          We may update this policy from time to time. Changes will be posted on
          our website, and we encourage you to review this page periodically.
        </p>

        <p>
          If there are material changes, we will notify you via email or website
          announcement.
        </p>
      </section>
      <section>
        <h2>14. CONTACT US</h2>
        <p>
          If you have any questions about this Privacy Policy, you can reach us
          at:
        </p>
        <p>
          Email:{" "}
          <a href="mailto:sebastjan.bas@gmail.com?cc=almn140803@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.></p>">
            support@slovene-step-by-step.com
          </a>{" "}
          <br /> Website:{" "}
          <a href="https://slovenscinakzk.com/">
            slovenscinakzk.com
          </a>
        </p>
        <p>
          If you believe we have violated your data rights, you have the right
          to file a complaint with your local data protection authority.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicyPage;
