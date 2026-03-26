import "../legal.css";
import {Metadata} from "next";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Terms of Service",
    description: "Terms of Service for Slovenščina Korak za Korakom. Read our policies governing use of our language learning platform.",
    alternates: getAlternates("/legal/terms-of-service", locale),
  };
}

const TermsOfServicePage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mb-16">
      <section>
        <h1>TERMS OF SERVICE</h1>
        <p>Last Updated: 1st January 2025</p>
        <p>
          Welcome to Slovenščina Korak za Korkom! By accessing or using our services,
          you agree to the following Terms of Service (“Terms”). Please read
          them carefully before using our website or enrolling in our language
          learning programs.
        </p>
      </section>

      <section>
        <h2>1. INTRODUCTION</h2>
        <p>
          Slovenščina Korak za Korkom (“Company,” “we,” “us,” or “our”) provides online
          language learning services, including personalized lessons, materials,
          and tutor-led sessions. These Terms apply to all users, including
          students, tutors, and visitors to our website.
        </p>
        <p>By using our services, you confirm that you:</p>
        <ul>
          <li>
            Are at least 18 years old (or have parental consent if under 18).
          </li>
          <li>Have read and agreed to these Terms.</li>
          <li>Will comply with all applicable laws and regulations.</li>
        </ul>
      </section>

      <section>
        <h2>2. SERVICES & ENROLMENT</h2>
        <h3>2.1. Course Access</h3>
        <p>
          Upon signing up, you gain access to our learning materials and
          scheduled lessons. Access is for personal use only and may not be
          shared, resold, or transferred.
        </p>
        <h3>2.2. Trial Lessons</h3>
        <p>
          We may offer a free or discounted trial lesson to new students. The
          availability and conditions of trial lessons are subject to change at
          our discretion.
        </p>
        <h3>2.3. Scheduling & Cancellations</h3>
        <ul>
          <li>
            Lesson scheduling: Students can book lessons based on tutor
            availability.
          </li>
          <li>
            Cancellations & Rescheduling: Cancellations must be made at least 24
            hours in advance to qualify for rescheduling. Late cancellations or
            no-shows may result in the lesson being forfeited.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. PAYMENT & REFUNDS</h2>

        <h3>3.1. Pricing</h3>
        <p>
          Our pricing for lessons and packages is listed on our website and may
          change over time. Any changes will not affect previously purchased
          lessons.
        </p>
        <h3>3.2. Payments</h3>
        <p>
          All payments must be made in advance via our accepted payment methods.
          By purchasing a course, you authorize us to charge your selected
          payment method.
        </p>
        <h3>3.3. Refund Policy</h3>
        <ul>
          <li>
            Refunds are available only under specific conditions, such as
            service unavailability or technical issues caused by us.
          </li>
          <li>
            If you are unsatisfied with our lessons, please contact us within 14
            days for a resolution.
          </li>
        </ul>
      </section>
      <section>
        <h2>4. CODE OF CONDUCT</h2>
        <p>To ensure a respectful learning environment, all users must:</p>
        <ul>
          <li>Be respectful toward tutors and other students.</li>
          <li>
            Not share, copy, or distribute course materials without permission.
          </li>
          <li>
            Not engage in harassment, discrimination, or inappropriate behavior.
          </li>
          <li>Follow all ethical guidelines when using our platform.</li>
        </ul>
        <p>
          Failure to follow these rules may result in suspension or termination
          of your access to our services without a refund.
        </p>
      </section>
      <section>
        <h2>5. INTELLECTUAL PROPERTY</h2>
        <p>
          All course materials, including text, videos, graphics, and lesson
          content, are the intellectual property of Slovenščina Korak za Korkom. You
          may not copy, modify, or distribute them without our written
          permission.
        </p>
      </section>
      <section>
        <h2>6. DISCLAIMERS & LIMITATION OF LIABILITY</h2>
        <ul>
          <li>
            We strive to provide high-quality lessons, but we do not guarantee
            specific learning outcomes.
          </li>
          <li>
            Our services are provided “as is” without any warranties regarding
            uninterrupted access or error-free functionality.
          </li>
          <li>
            We are not liable for technical issues, internet disruptions, or
            third-party platform failures that may affect lesson delivery.
          </li>
        </ul>
      </section>
      <section>
        <h2>7. CHANGES TO THE TERMS</h2>
        <p>
          We may update these Terms from time to time. Changes will take effect
          upon posting on our website. If you continue using our services after
          changes are posted, you accept the updated Terms.
        </p>
      </section>
      <section>
        <h2>8. CONTACT INFORMATION</h2>
        <p>
          If you have any questions or concerns about these Terms, you can
          contact us at:
        </p>
        <p>
          Email:{" "}
          <a href="mailto:sebastjan.bas@gmail.com?cc=almn140803@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.></p>">
            support@slovene-step-by-step.com
          </a>{" "}
          <br />
          Website:{" "}
          <a href="https://slovenscinakzk.com/">
            slovenscinakzk.com
          </a>
        </p>
      </section>
    </div>
  );
};

export default TermsOfServicePage;
