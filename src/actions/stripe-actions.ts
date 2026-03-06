"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "@/db";
import { langClubBookingsTable, langClubTable } from "@/db/schema";
import { and, eq, gt, ne, or } from "drizzle-orm";
import Stripe from "stripe";
import BookingConfEmail from "@/emails/booking-conf-email";
import RescheduleConfEmail from "@/emails/reschedule-conf-email";
import CancellationConfEmail from "@/emails/cancellation-conf-email";
import {bookingsRevenue, bookingsTotal, emailDuration, emailErrors, emailsSent} from "@/lib/metrics";
import {resend} from "@/lib/resend";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

// Direct booking without Stripe checkout
export const bookEventDirect = async (eventId: string) => {
  const { userId } = await auth();
  const client = await clerkClient();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  const user = await client.users.getUser(userId);

  if (!eventId) {
    return { error: "Event ID is required", status: 400 };
  }

  try {
    // Get the event details
    const event = await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, Number(eventId)),
    });

    if (!event) {
      return { error: "Event not found", status: 404 };
    }

    const now = new Date();
    if (event.date < now) {
      return { error: "Cannot book past events", status: 400 };
    }

    if (event.peopleBooked >= event.maxBooked) {
      return { error: "Event is full", status: 400 };
    }

    // Check if user already has a booking for this specific event
    const existingBooking = await db.query.langClubBookingsTable.findFirst({
      where: and(
        eq(langClubBookingsTable.userId, userId),
        eq(langClubBookingsTable.eventId, Number(eventId)),
        or(
          eq(langClubBookingsTable.status, "paid"),
          eq(langClubBookingsTable.status, "booked")
        )
      ),
    });

    if (existingBooking) {
      return {
        error: "You already have a booking for this event",
        status: 400,
      };
    }

    // Create booking record directly with paid status
    const booking = await db
      .insert(langClubBookingsTable)
      .values({
        eventId: Number(eventId),
        userId: userId,
        status: "booked",
        amount: event.price,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update the event to increase people booked
    await db
      .update(langClubTable)
      .set({
        peopleBooked: event.peopleBooked + 1,
      })
      .where(eq(langClubTable.id, Number(eventId)));

    // Generate ICS file
    const icsContent = generateICSFile(
      booking[0].id.toString(),
      user.unsafeMetadata.locale as string,
      event.date,
      event.duration,
      new Date(),
      event.description,
      event.location,
      event.theme
    );

    bookingsTotal.inc({status: "booked", type: "language_club"})
    console.log('bookings_total INCREMENTED: {status: "booked", type: "language_club"}')

    const emailTimer = emailDuration.startTimer({template: "lang_club_booking_confirmation"})

    // Send email confirmation
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [user.emailAddresses[0].emailAddress],
      subject: "Booking Confirmation",
      react: BookingConfEmail({
        name: user.firstName,
        locale: user.unsafeMetadata.locale as string,
        lessonDate: event.date,
        lessonDuration: event.duration,
        teacherName: event.tutor,
        lessonTheme: event.theme,
        lessonLocation: event.location,
        lessonDescription: event.description,
        lessonLevel: event.level,
      }),
      attachments: [
        {
          filename: "event.ics",
          content: Buffer.from(icsContent),
          contentType: "text/calendar; method=REQUEST; charset=UTF-8",
        },
      ],
    });

    emailTimer()

    if (emailError) {
      emailErrors.labels({ template: "lang_club_booking_confirmation" }).inc();
      return { error: "Email could not be send" };
    }
    emailsSent.labels({ template: "lang_club_booking_confirmation" }).inc();
    bookingsRevenue.labels({type: "language_club"}).inc(12.5)

    return {
      success: true,
      bookingId: booking[0].id,
      event: {
        id: event.id,
        theme: event.theme,
        date: event.date,
        tutor: event.tutor,
        location: event.location,
        duration: event.duration,
        description: event.description,
        level: event.level,
      },
      emailData: emailData,
    };
  } catch (error) {
    console.error("Error booking event directly:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const createCheckoutSession = async (
  eventId: string,
  locale: "en" | "it" | "sl" | "ru"
) => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!eventId) {
    return { error: "Event ID is required", status: 400 };
  }

  try {
    // Get the event details
    const event = await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, Number(eventId)),
    });

    if (!event) {
      return { error: "Event not found", status: 404 };
    }

    const now = new Date();
    if (event.date < now) {
      return { error: "Cannot book past events", status: 400 };
    }

    if (event.peopleBooked >= event.maxBooked) {
      return { error: "Event is full", status: 400 };
    }

    // Check if user already has a paid booking for this specific event
    const existingBooking = await db.query.langClubBookingsTable.findFirst({
      where: and(
        eq(langClubBookingsTable.userId, userId),
        eq(langClubBookingsTable.eventId, Number(eventId)),
        eq(langClubBookingsTable.status, "paid")
      ),
    });

    if (existingBooking) {
      return {
        error: "You already have a booking for this event",
        status: 400,
      };
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "paypal"],
      locale: locale,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Language Club: ${event.theme}`,
              description: event.description || "",
              metadata: {
                eventId: event.id.toString(),
                tutor: event.tutor,
                level: event.level || "",
                location: event.location,
                duration: event.duration?.toString() || "",
              },
            },
            unit_amount: Math.round(parseFloat(event.price.toString()) * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/language-club?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/${locale}/language-club?canceled=true`,
      metadata: {
        eventId: event.id.toString(),
        userId: userId,
      },
    });

    // Note: Booking record will be created after successful payment via webhook
    // This prevents creating pending bookings for cancelled sessions

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const rescheduleBooking = async (
  bookingId: string,
  newEventId: string
) => {
  const { userId } = await auth();
  const client = await clerkClient();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  const user = await client.users.getUser(userId);

  if (!bookingId || !newEventId) {
    return { error: "Booking ID and new event ID are required", status: 400 };
  }
  try {
    // Get the current booking details
    const currentBooking = await db.query.langClubBookingsTable.findFirst({
      where: and(
        eq(langClubBookingsTable.id, Number(bookingId)),
        eq(langClubBookingsTable.userId, userId),
        or(
          eq(langClubBookingsTable.status, "paid"),
          eq(langClubBookingsTable.status, "booked")
        )
      ),
    });

    if (!currentBooking) {
      return { error: "Booking not found or already cancelled", status: 404 };
    }

    // Get the current event details
    const currentEvent = await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, currentBooking.eventId),
    });

    if (!currentEvent) {
      return { error: "Current event not found", status: 404 };
    }

    // Get the new event details
    const newEvent = await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, Number(newEventId)),
    });

    if (!newEvent) {
      return { error: "New event not found", status: 404 };
    }

    // Check if the current event is in the future
    const now = new Date();
    if (currentEvent.date <= now) {
      return { error: "Cannot reschedule past events", status: 400 };
    }

    // Check if the new event has available spots
    if (newEvent.peopleBooked >= newEvent.maxBooked) {
      return { error: "New event is full", status: 400 };
    }

    // Check if user already has a booking for the new event
    const existingBooking = await db.query.langClubBookingsTable.findFirst({
      where: and(
        eq(langClubBookingsTable.userId, userId),
        eq(langClubBookingsTable.eventId, Number(newEventId)),
        or(
          eq(langClubBookingsTable.status, "paid"),
          eq(langClubBookingsTable.status, "booked")
        )
      ),
    });

    if (existingBooking) {
      return {
        error: "You already have a booking for this event",
        status: 400,
      };
    }

    // Start a transaction to update both events and the booking
    await db.transaction(async (tx) => {
      // Update the booking to point to the new event
      await tx
        .update(langClubBookingsTable)
        .set({
          eventId: Number(newEventId),
          updatedAt: new Date(),
        })
        .where(eq(langClubBookingsTable.id, Number(bookingId)));

      // Decrease people booked for the old event
      await tx
        .update(langClubTable)
        .set({
          peopleBooked: currentEvent.peopleBooked - 1,
        })
        .where(eq(langClubTable.id, currentBooking.eventId));

      // Increase people booked for the new event
      await tx
        .update(langClubTable)
        .set({
          peopleBooked: newEvent.peopleBooked + 1,
        })
        .where(eq(langClubTable.id, Number(newEventId)));
    });

    // Generate ICS file for the new event
    const icsContent = generateICSFile(
      bookingId,
      user.unsafeMetadata.locale as string,
      newEvent.date,
      newEvent.duration,
      new Date(),
      newEvent.description,
      newEvent.location,
      newEvent.theme
    );

    const emailTimer = emailDuration.startTimer({template: "reschedule_confirmation"})

    // Send a reschedule confirmation email
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [user.emailAddresses[0].emailAddress],
      subject: "Reschedule Confirmation",
      react: RescheduleConfEmail({
        name: user.firstName,
        locale: user.unsafeMetadata.locale as string,
        // Old event details
        oldLessonDate: currentEvent.date,
        oldLessonDuration: currentEvent.duration,
        oldTeacherName: currentEvent.tutor,
        oldLessonTheme: currentEvent.theme,
        oldLessonLocation: currentEvent.location,
        oldLessonDescription: currentEvent.description,
        oldLessonLevel: currentEvent.level,
        // New event details
        newLessonDate: newEvent.date,
        newLessonDuration: newEvent.duration,
        newTeacherName: newEvent.tutor,
        newLessonTheme: newEvent.theme,
        newLessonLocation: newEvent.location,
        newLessonDescription: newEvent.description,
        newLessonLevel: newEvent.level,
      }),
      attachments: [
        {
          filename: "event.ics",
          content: Buffer.from(icsContent),
          contentType: "text/calendar; method=REQUEST; charset=UTF-8",
        },
      ],
    });

    emailTimer();

    if (emailError) {
      emailErrors.labels({template: "reschedule_confirmation"}).inc();
      console.error("Error sending reschedule email:", emailError);
      // Don't return error here - the booking is already updated
      // Just log the error and continue
    }

    emailsSent.labels({ template: "reschedule_confirmation" }).inc();

    return {
      success: true,
      message: "Booking rescheduled successfully",
      newEvent: {
        id: newEvent.id,
        theme: newEvent.theme,
        date: newEvent.date,
        tutor: newEvent.tutor,
        location: newEvent.location,
      },
      emailData: emailError ? null : emailData,
    };
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const getAvailableEvents = async (currentEventId: number) => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!currentEventId) {
    return { error: "Current event ID is required", status: 400 };
  }
  try {
    // Get all future events that are not the current event
    const now = new Date();
    const events = await db.query.langClubTable.findMany({
      where: and(
        gt(langClubTable.date, now),
        ne(langClubTable.id, currentEventId)
      ),
      orderBy: (langClubTable, { asc }) => [asc(langClubTable.date)],
    });

    // Transform events to include calculated fields
    const transformedEvents = events.map((event) => ({
      id: event.id,
      tutor: event.tutor,
      date: event.date,
      theme: event.theme,
      description: event.description || "",
      level: event.level || "",
      location: event.location,
      maxBooked: event.maxBooked || 8,
      peopleBooked: event.peopleBooked || 0,
      duration: event.duration || 45,
      price: parseFloat(event.price.toString()),
      stripeProductId: event.stripeProductId,
      stripePriceId: event.stripePriceId,
    }));

    return {
      success: true,
      events: transformedEvents,
    };
  } catch (error) {
    console.error("Fetch available events error:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const cancelBooking = async (bookingId: number) => {
  try {
    const { userId } = await auth();
    const client = await clerkClient();
    if (!userId) {
      return { message: "Unauthorized", status: 401 };
    }
    const user = await client.users.getUser(userId);

    if (!bookingId) {
      return { message: "Booking ID is required", status: 400 };
    }

    // Get the booking details
    const booking = await db.query.langClubBookingsTable.findFirst({
      where: and(
        eq(langClubBookingsTable.id, bookingId),
        eq(langClubBookingsTable.userId, userId),
        or(
          eq(langClubBookingsTable.status, "paid"),
          eq(langClubBookingsTable.status, "booked")
        )
      ),
    });

    if (!booking) {
      return { message: "Booking not found or already cancelled", status: 404 };
    }

    // Get the event details
    const event = await db.query.langClubTable.findFirst({
      where: eq(langClubTable.id, booking.eventId),
    });

    if (!event) {
      return { message: "Event not found", status: 404 };
    }

    // Check if the event is more than 48 hours in the future (allow cancellation only if more than 48 hours remain)
    const now = new Date();
    const eventDate = new Date(event.date);
    const hoursUntilEvent =
      (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilEvent <= 24) {
      return {
        message: "Cannot cancel events within 24 hours of the start time",
        status: 400,
      };
    }

    if (booking.status === "paid") {
      // Process Stripe refund
      let refund;
      try {
        refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId!,
          reason: "requested_by_customer",
        });
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        return { message: "Failed to process refund", status: 500 };
      }

      // Update booking status to refunded is managed by webhook

      // Decrease the number of people booked for the event
      await db
        .update(langClubTable)
        .set({
          peopleBooked: event.peopleBooked - 1,
        })
        .where(eq(langClubTable.id, booking.eventId));

      return {
        status: 200,
        refundId: refund.id,
        message: "Booking cancelled successfully. Refund will be processed.",
      };
    } else {
      // Update booking status to cancelled
      await db
        .update(langClubBookingsTable)
        .set({
          status: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(langClubBookingsTable.id, bookingId));

      // Decrease the number of people booked for the event
      await db
        .update(langClubTable)
        .set({
          peopleBooked: event.peopleBooked - 1,
        })
        .where(eq(langClubTable.id, booking.eventId));

      bookingsTotal.inc({status: "cancelled", type: "language_club"})
      console.log('bookings_total INCREMENTED: {status: "cancelled", type: "language_club"}')


      const emailTimer = emailDuration.startTimer({template: "cancellation_confirmation"})
      // Send cancellation confirmation email
      const { error: emailError } = await resend.emails.send({
        from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
        to: [user.emailAddresses[0].emailAddress],
        subject: "Cancellation Confirmation",
        react: CancellationConfEmail({
          name: user.firstName,
          locale: user.unsafeMetadata.locale as string,
          eventType: "language-club",
          lessonDate: event.date,
          lessonDuration: event.duration,
          teacherName: event.tutor,
          lessonTheme: event.theme,
          lessonLocation: event.location,
          lessonDescription: event.description,
          lessonLevel: event.level,
        }),
      });

      emailTimer();

      if (emailError) {
        emailErrors.labels({ template: "cancellation_confirmation" }).inc();
        console.error("Error sending cancellation email:", emailError);
        // Don't return error here - the booking is already cancelled
        // Just log the error and continue
      }

      emailsSent.labels({ template: "cancellation_confirmation" }).inc();

      return {
        status: 200,
        message: "Booking cancelled successfully",
      };
    }
  } catch (error) {
    console.error("Cancel booking error:", error);
    return { message: "Internal server error", status: 500 };
  }
};

// Generate an ICS file for calendar invite
const generateICSFile = (
  bookingId: string,
  locale: string = "en",
  date: Date,
  duration: number,
  createdAt: Date,
  description: string,
  location: string,
  theme: string
) => {
  const startDate = date
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const endDate = new Date(date.getTime() + duration * 60000)
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const dtstamp = createdAt
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//slovenscinakzk.com//Calendar Invite//${locale.toUpperCase()}
BEGIN:VEVENT
UID:${bookingId}@slovenscinakzk.com
DTSTAMP:${dtstamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Pogovorni klub - ${theme}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
  return icsContent;
};
