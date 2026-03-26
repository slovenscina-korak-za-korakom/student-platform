import "../legal.css";
import {Metadata} from "next";
import { getAlternates } from "@/lib/seo";

export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "License Agreement",
    description: "License Agreement for Slovenščina Korak za Korakom. Understand your rights and obligations when using our platform and educational content.",
    alternates: getAlternates("/legal/license", locale),
  };
}

const LicenseePage = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full mb-16">
      <section>
        <h1>LICENSE AGREEMENT</h1>
        <p>Last Updated: 1st January 2025</p>
        <p>
          This License Agreement (“Agreement”) is a legal contract between
          Slovenščina Korak za Korkom (“Licensor,” “we,” “us,” or “our”) and you
          (“Licensee,” “you,” or “your”). It governs your access to and use of
          our website, software, educational content, and services
          (collectively, the “Licensed Materials”).
        </p>
        <p>
          By accessing or using the Licensed Materials, you agree to be bound by
          this Agreement. If you do not agree, do not use our services.
        </p>
      </section>
      <section>
        <h2>1. GRANT OF LICENSE</h2>
        <h3>1.1. License Grant</h3>
        <p>
          Subject to your compliance with this Agreement, we grant you a
          limited, non-exclusive, non-transferable, revocable license to access
          and use our Licensed Materials for personal, non-commercial
          educational purposes only.
        </p>

        <h3>1.2. Restrictions</h3>

        <p>
          You may <strong>NOT:</strong>
        </p>
        <ul>
          <li>
            Sell, sublicense, distribute, or publicly share any Licensed
            Materials.
          </li>
          <li>
            Modify, reverse-engineer, decompile, or attempt to extract source
            code from our software.
          </li>
          <li>
            Use the Licensed Materials for commercial purposes without written
            consent.
          </li>
          <li>
            Remove or alter any copyright, trademark, or proprietary notices.
          </li>
          <li>
            Use our content for AI training, data mining, or automated analysis.
          </li>
        </ul>
        <h3>1.3. Ownership</h3>
        <p>
          We retain full ownership of all Licensed Materials, including
          copyrights, trademarks, and intellectual property rights. No rights
          are transferred to you beyond the limited license granted herein.
        </p>
      </section>
      <section>
        <h2>2. USER ACCOUNTS</h2>
        <h3>2.1. Account Registration</h3>
        <p>
          To access certain features, you must create an account. You agree to
          provide accurate, complete, and up-to-date information.
        </p>
        <h3>2.2. Account Security</h3>
        <p>
          You are responsible for maintaining the security of your account
          credentials. We are not liable for unauthorized access to your account
          due to your negligence.
        </p>
        <h3>2.3. Account Termination</h3>
        <p>
          We reserve the right to suspend or terminate your account if you
          violate this Agreement. Upon termination, you must stop using the
          Licensed Materials immediately.
        </p>
      </section>
      <section>
        <h2>3. FEES & PAYMENT (IF APPLICABLE)</h2>
        <h3>3.1. Pricing & Payments</h3>
        <p>
          Certain services may require payment. By purchasing, you agree to pay
          the listed fees, including applicable taxes.
        </p>
        <h3>3.2. Subscription & Cancellation</h3>

        <ul>
          <li>
            Subscriptions renew automatically unless canceled before the renewal
            date.
          </li>
          <li>
            You may cancel at any time, but refunds are not guaranteed unless
            required by law.
          </li>
        </ul>
        <h3>3.3. Payment Processing</h3>
        <p>
          Payments are handled by third-party processors. We do not store
          payment details.
        </p>
      </section>
      <section>
        <h2>4. CONTENT & INTELLECTUAL PROPERTY</h2>
        <h3>4.1. Our Content</h3>
        <p>
          All text, graphics, videos, lessons, and software provided by us are
          protected by copyright and trademark laws.
        </p>
        <h3>4.2. User-Generated Content</h3>

        <ul>
          <li>
            If you submit content (e.g., feedback, comments), you grant us a
            non-exclusive, royalty-free, worldwide license to use, display, and
            distribute it.
          </li>
          <li>
            You must own or have rights to any content you submit and ensure it
            does not violate third-party rights.
          </li>
        </ul>
      </section>
      <section>
        <h2>5. DISCLAIMER OF WARRANTIES</h2>
        <p>
          The Licensed Materials are provided “as is” and “as available,”
          without warranties of any kind, including:
        </p>
        <ul>
          <li>
            No Warranty of Accuracy: We do not guarantee that our content is
            free from errors.
          </li>
          <li>
            No Warranty of Availability: We do not guarantee uninterrupted
            access to our services.
          </li>
          <li>
            No Warranty of Fitness for a Particular Purpose: We are not
            responsible if our services do not meet your expectations or
            learning goals.
          </li>
        </ul>
      </section>
      <section>
        <h2>6. LIMITATION OF LIABILITY</h2>
        <p>To the fullest extent permitted by law:</p>

        <ul>
          <li>
            We are not liable for any indirect, incidental, or consequential
            damages arising from your use of the Licensed Materials.
          </li>
          <li>
            Our total liability shall not exceed the amount you paid (if any)
            for access to our services in the past 6 months.
          </li>
          <li>
            We are not responsible for third-party content or services linked to
            our platform.
          </li>
        </ul>
      </section>
      <section>
        <h2>7. PRIVACY & DATA PROCESSING</h2>

        <p>
          We collect and process your personal data in accordance with our
          Privacy Policy. By using our services, you consent to our data
          handling practices.
        </p>
        <p>
          We use Clerk Auth for authentication and account management. Please
          review the{" "}
          <a href="https://clerk.com/legal/privacy">Clerk Privacy Policy</a> for
          more information.
        </p>
      </section>
      <section>
        <h2>8. TERMINATION</h2>
        <h3>8.1. Termination by You</h3>
        <p>
          You may stop using our services at any time. If you delete your
          account, you will lose access to all Licensed Materials.
        </p>
        <h3>8.2. Termination by Us</h3>
        <p>We may suspend or terminate your access without notice if:</p>
        <ul>
          <li>You violate this Agreement.</li>
          <li>We discontinue the Licensed Materials.</li>
        </ul>
        <p>
          Upon termination, your license immediately expires, and you must stop
          using our content.
        </p>
      </section>
      <section>
        <h2>9. GOVERNING LAW & DISPUTE RESOLUTION</h2>
        <h3>9.1. Governing Law</h3>
        <p>
          This Agreement is governed by the laws of [Insert Jurisdiction, e.g.,
          Slovenia or the European Union], without regard to conflict of law
          principles.
        </p>
      </section>
      <section>
        <h2>10. CHANGES TO THIS AGREEMENT</h2>
        <p>
          We may update this Agreement at any time. Changes take effect when
          posted on our website. Continued use after modifications means you
          accept the updated terms.
        </p>
      </section>
      <section>
        <h2>11. CONTACT INFORMATION</h2>
        <p>If you have questions about this Agreement, please contact us:</p>
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
      </section>
    </div>
  );
};

export default LicenseePage;
