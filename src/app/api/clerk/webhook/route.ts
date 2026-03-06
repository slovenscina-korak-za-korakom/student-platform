import WelcomeEmail from "@/emails/welcome-email";
import { resend } from "@/lib/resend";
import {
  userSignups,
  emailsSent,
  emailDuration,
  emailErrors,
} from "@/lib/metrics";

export async function POST(request: Request) {
  const { data, type } = await request.json();

  if (type === "user.created") {
    try {
      // Record user signup metric
      const locale = data.unsafe_metadata?.locale || "en";
      userSignups.labels({ locale }).inc();

      // Send welcome email with timing
      const emailTimer = emailDuration.startTimer({ template: "welcome" });
      const { data: emailData, error } = await resend.emails.send({
        from: "Slovenščina Korak za Korakom <welcome@slovenscinakzk.com>",
        to: [data.email_addresses[0].email_address],
        subject: "Welcome to Slovenščina Korak za Korakom",
        react: WelcomeEmail({
          name: data.first_name,
          locale: data.unsafe_metadata.locale,
        }),
      });
      emailTimer();

      if (error) {
        emailErrors.labels({ template: "welcome" }).inc();
        return Response.json({ error }, { status: 500 });
      }

      emailsSent.labels({ template: "welcome" }).inc();
      return Response.json(emailData);
    } catch (error) {
      return Response.json({ error }, { status: 500 });
    }
  } else {
    return Response.json({ error: "Invalid event type" }, { status: 400 });
  }
}
