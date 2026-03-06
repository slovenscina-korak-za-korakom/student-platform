"use server";

import {db} from "@/db";
import {schedulesTable, timeblocksTable, tutorsTable} from "@/db/schema";
import {auth, clerkClient} from "@clerk/nextjs/server";
import {TutoringSession} from "@/components/calendar/types";
import {and, eq, gte, lt} from "drizzle-orm";
import SessionConfEmail from "@/emails/session-conf-email";
import CancellationConfEmail from "@/emails/cancellation-conf-email";
import TutorSessionConfEmail from "@/emails/tutor-session-conf-email";
import TutorSessionCancelEmail from "@/emails/tutor-session-cancel-email";
import {bookingsRevenue, bookingsTotal, emailDuration, emailErrors, emailsSent} from "@/lib/metrics";
import {resend} from "@/lib/resend";


export const getSchedule = async () => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  try {
    const schedule = await db.select().from(schedulesTable);
    return { status: 200, scheduleData: schedule };
  } catch (error) {
    console.error("Error getting schedules:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const getTimeblocks = async () => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  try {
    const timeblocks = await db.select().from(timeblocksTable);
    return { status: 200, timeblocks: timeblocks };
  } catch (error) {
    console.error("Error getting timeblocks:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const getTutors = async () => {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 };
  }
  try {
    const tutors = await db.select().from(tutorsTable);
    return { status: 200, tutors: tutors };
  } catch (error) {
    console.error("Error getting tutors:", error);
    return { error: "Internal server error", status: 500 };
  }
};

export const bookSession = async (data: TutoringSession) => {
  const { userId } = await auth();
  const client = await clerkClient();

  if (!userId) {
    return { message: "Unauthorized", status: 401 };
  }

  try {
    const user = await client.users.getUser(userId);

    // Get the tutor details
    const tutor = await db.query.tutorsTable.findFirst({
      where: eq(tutorsTable.id, data.tutorId),
    });

    if (!tutor) {
      return { message: "Tutor not found", status: 404 };
    }

    // Check if slot is already booked (prevent double booking)
    const newSlotStart = new Date(data.startTime);
    const newSlotEnd = new Date(newSlotStart.getTime() + data.duration * 60000);

    // Query for existing bookings for this tutor on the same day
    const dayStart = new Date(newSlotStart);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(newSlotStart);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await db
      .select()
      .from(timeblocksTable)
      .where(
        and(
          eq(timeblocksTable.tutorId, data.tutorId),
          eq(timeblocksTable.status, "booked"),
          gte(timeblocksTable.startTime, dayStart),
          lt(timeblocksTable.startTime, dayEnd),
        )
      );

    // Check for time overlap with existing bookings
    for (const existing of existingBookings) {
      const existingStart = new Date(existing.startTime);
      const existingEnd = new Date(existingStart.getTime() + existing.duration * 60000);

      // Overlap: new starts before existing ends AND new ends after existing starts
      if (newSlotStart < existingEnd && newSlotEnd > existingStart) {
        return { message: "This time slot is no longer available", status: 409 };
      }
    }

    // Insert the session
    const response = await db
      .insert(timeblocksTable)
      .values({
        tutorId: data.tutorId,
        startTime: data.startTime,
        duration: data.duration,
        status: "booked",
        sessionType: data.sessionType,
        location: data.location,
        studentId: userId,
      })
      .returning();

    // collect metrics
    bookingsTotal.inc({status: "booked", type: data.sessionType})
    console.log(`bookings_total INCREMENTED: {status: "booked", type: ${data.sessionType}}`)
    bookingsRevenue.labels({type: data.sessionType}).inc(tutor.level === "junior" ? (data.duration === 45 ? 15 : 20) : (data.duration === 45 ? 17 : 22))

    const sessionId = response[0].id;

    // Generate ICS file for calendar invite
    const icsContent = generateSessionICSFile(
      sessionId.toString(),
      (user.unsafeMetadata.locale as string) || "en",
      data.startTime,
      data.duration,
      new Date(),
      data.sessionType,
      data.location,
      tutor.name
    );

    const emailTimer = emailDuration.startTimer({template: "booking_confirmation"})
    // Send confirmation email to student
    const { error: emailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [user.emailAddresses[0].emailAddress],
      subject: "Session Booking Confirmation",
      react: SessionConfEmail({
        name: user.firstName,
        locale: (user.unsafeMetadata.locale as string) || "en",
        startTime: data.startTime,
        duration: data.duration,
        tutorName: tutor.name,
        sessionType: data.sessionType,
        location: data.location,
      }),
      attachments: [
        {
          filename: "session.ics",
          content: Buffer.from(icsContent),
          contentType: "text/calendar; method=REQUEST; charset=UTF-8",
        },
      ],
    });
    emailTimer()

    if (emailError) {
      emailErrors.labels({ template: "booking_confirmation" }).inc();
      console.error("Error sending confirmation email to student:", emailError);
      // Don't return error here - the session is already booked
      // Just log the error and continue
    }
    emailsSent.labels({ template: "booking_confirmation" }).inc();


    // Send confirmation email to tutor
    const studentName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || "Student";
    const studentEmail = user.emailAddresses[0].emailAddress;
    const tutorLocale = "en"; // Default to English for tutors

    const emailTimer2 = emailDuration.startTimer({template: "tutor_booking_confirmation"})

    const { error: tutorEmailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [tutor.email],
      subject: "New Booking - Student Session",
      react: TutorSessionConfEmail({
        tutorName: tutor.name,
        locale: tutorLocale,
        studentName: studentName,
        studentEmail: studentEmail,
        studentBookingCount: 0, // TODO: Calculate actual booking count in the future
        sessionDate: data.startTime,
        sessionDuration: data.duration,
        sessionType: data.sessionType,
        location: data.location,
        sessionNotes: undefined,
      }),
    });
    emailTimer2()

    if (tutorEmailError) {
      emailErrors.labels({ template: "tutor_booking_confirmation" }).inc();
      console.error("Error sending confirmation email to tutor:", tutorEmailError);
      // Don't return error here - the session is already booked
      // Just log the error and continue
    }

    emailsSent.labels({ template: "tutor_booking_confirmation" }).inc();

    return {
      message: "Session booked successfully",
      status: 200,
      response: response,
    };
  } catch (error) {
    console.error("Error booking session:", error);
    return { message: "Error booking session", status: 500 };
  }
};

export const cancelSession = async (sessionId: number) => {
  const { userId } = await auth();
  const client = await clerkClient();
  if (!userId) {
    return { message: "Unauthorized", status: 401 };
  }

  if (!sessionId) {
    return { message: "Session ID is required", status: 400 };
  }

  try {
    const user = await client.users.getUser(userId);

    // Get the session details
    const session = await db.query.timeblocksTable.findFirst({
      where: and(
        eq(timeblocksTable.id, sessionId),
        eq(timeblocksTable.studentId, userId),
        eq(timeblocksTable.status, "booked"),
      ),
    });

    if (!session) {
      return { error: "Session not found or already cancelled", status: 404 };
    }

    // Get the tutor details
    const tutor = await db.query.tutorsTable.findFirst({
      where: eq(tutorsTable.id, session.tutorId),
    });

    if (!tutor) {
      return { error: "Tutor not found", status: 404 };
    }

    // Check if the session is more than 24 hours in the future
    const now = new Date();
    const sessionDate = new Date(session.startTime);
    const hoursUntilSession =
      (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilSession <= 24) {
      console.log("CANNOT CANCEL WITHIN 24 hours")
      return {
        error: "Cannot cancel sessions within 24 hours of the start time",
        status: 400,
      };
    }

    // Update session status to cancelled
    await db
      .update(timeblocksTable)
      .set({
        status: "cancelled",
      })
      .where(eq(timeblocksTable.id, sessionId));


    bookingsTotal.inc({status: "cancelled", type: session.sessionType})
    console.log(`bookings_total INCREMENTED: {status: "cancelled", type: ${session.sessionType}}`)

    const emailTimer = emailDuration.startTimer({template: "cancellation_confirmation"});

    // Send cancellation confirmation email to student
    const { error: emailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [user.emailAddresses[0].emailAddress],
      subject: "Session Cancellation Confirmation",
      react: CancellationConfEmail({
        name: user.firstName,
        locale: (user.unsafeMetadata.locale as string) || "en",
        eventType: "personal-session",
        startTime: session.startTime,
        duration: session.duration,
        tutorName: tutor.name,
        sessionType: session.sessionType,
        location: session.location,
      }),
    });

    emailTimer()

    if (emailError) {
      emailErrors.labels({ template: "cancellation_confirmation" }).inc();
      console.error("Error sending cancellation email to student:", emailError);
      // Don't return error here - the session is already cancelled
      // Just log the error and continue
    }

    emailsSent.labels({ template: "cancellation_confirmation" }).inc();

    // Send cancellation notification email to tutor
    const studentName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || "Student";
    const tutorLocale = "en"; // Default to English for tutors

    const emailTimer2 = emailDuration.startTimer({template: "tutor_cancellation_confirmation"});

    const { error: tutorEmailError } = await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [tutor.email],
      subject: "Session Cancelled - Student Cancellation",
      react: TutorSessionCancelEmail({
        tutorName: tutor.name,
        locale: tutorLocale,
        studentName: studentName,
        sessionDate: session.startTime,
        sessionDuration: session.duration,
        sessionType: session.sessionType,
        location: session.location,
        cancellationReason: undefined,
      }),
    });

    emailTimer2()

    if (tutorEmailError) {
      emailErrors.labels({ template: "tutor_cancellation_confirmation" }).inc();
      console.error("Error sending cancellation email to tutor:", tutorEmailError);
      // Don't return error here - the session is already cancelled
      // Just log the error and continue
    }

    emailsSent.labels({ template: "tutor_cancellation_confirmation" }).inc();

    return {
      message: "Session cancelled successfully",
      status: 200,
    };
  } catch (error) {
    console.error("Cancel session error:", error);
    return { error: "Internal server error", status: 500 };
  }
};

// Generate an ICS file for personal session calendar invite
const generateSessionICSFile = (
  sessionId: string,
  locale: string = "en",
  startTime: Date,
  duration: number,
  createdAt: Date,
  sessionType: string,
  location: string,
  tutorName: string
) => {
  const startDate = startTime
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const endDate = new Date(startTime.getTime() + duration * 60000)
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  const dtstamp = createdAt
    .toISOString()
    .replaceAll("-", "")
    .replaceAll(":", "")
    .replaceAll(".", "");
  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//slovenscinakzk.com//Calendar Invite//${locale.toUpperCase()}
BEGIN:VEVENT
UID:${sessionId}@slovenscinakzk.com
DTSTAMP:${dtstamp}
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:Slovenian Lesson - ${sessionType}
DESCRIPTION:Personal Slovenian lesson with ${tutorName}
LOCATION:${location}
END:VEVENT
END:VCALENDAR`;
};
