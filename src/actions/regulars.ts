"use server";

import {db} from "@/db";
import {cancelledRegularSessionsTable, regularInvitationsTable, tutorsTable} from "@/db/schema";
import {auth, clerkClient} from "@clerk/nextjs/server";
import {and, eq} from "drizzle-orm";
import {addMonths, addWeeks, format, isAfter, isBefore, setDay, startOfDay} from "date-fns";
import {fromZonedTime} from "date-fns-tz";
import TutorSessionCancelEmail from "@/emails/tutor-session-cancel-email";
import {RegularInvitation, CancelledSession, RegularSession} from "@/types/interfaces";
import {resend} from "@/lib/resend";

/**
 * Fetches all accepted regular invitations for the current user
 */
export async function getRegularInvitations(): Promise<RegularInvitation[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return db
    .select({
      id: regularInvitationsTable.id,
      tutorId: regularInvitationsTable.tutorId,
      studentClerkId: regularInvitationsTable.studentClerkId,
      status: regularInvitationsTable.status,
      dayOfWeek: regularInvitationsTable.dayOfWeek,
      startTime: regularInvitationsTable.startTime,
      duration: regularInvitationsTable.duration,
      location: regularInvitationsTable.location,
      description: regularInvitationsTable.description,
      color: regularInvitationsTable.color,
      timezone: regularInvitationsTable.timezone,
      tutorName: tutorsTable.name,
      tutorAvatar: tutorsTable.avatar,
      tutorColor: tutorsTable.color,
    })
    .from(regularInvitationsTable)
    .where(
      and(
        eq(regularInvitationsTable.studentClerkId, userId),
        eq(regularInvitationsTable.status, "accepted")
      )
    )
    .innerJoin(tutorsTable, eq(regularInvitationsTable.tutorId, tutorsTable.id));
}

/**
 * Generates recurring sessions from accepted regular invitations
 * Creates weekly occurrences for a 3-month rolling window
 * Filters out cancelled sessions
 */
export async function generateRecurringSessions(
  invitations: RegularInvitation[],
  studentId: string,
  cancelledSessions: CancelledSession[] = []
): Promise<RegularSession[]> {
  const sessions: RegularSession[] = [];
  const now = new Date();
  const threeMonthsFromNow = addMonths(now, 3);
  const today = startOfDay(now);

  // Create a Set of cancelled dates for quick lookup
  // Key format: "invitationId-dateISOString"
  const cancelledDatesSet = new Set(
    cancelledSessions.map(
      (cs) => `${cs.invitationId}-${startOfDay(new Date(cs.cancelledDate)).toISOString()}`
    )
  );

  for (const invitation of invitations) {
    // Find the first occurrence of this day of week from today
    let currentDate = setDay(today, invitation.dayOfWeek, { weekStartsOn: 1 });

    // If the day has already passed this week, move to next week
    if (isBefore(currentDate, today)) {
      currentDate = addWeeks(currentDate, 1);
    }

    // Generate sessions for the next 3 months
    while (isBefore(currentDate, threeMonthsFromNow)) {
      // Convert wall-clock time in the tutor's timezone to UTC
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const timezone = invitation.timezone || 'UTC';
      const sessionDateTime = fromZonedTime(`${dateStr}T${invitation.startTime}:00`, timezone);

      // Check if this date is cancelled
      const cancelKey = `${invitation.id}-${startOfDay(currentDate).toISOString()}`;
      const isCancelled = cancelledDatesSet.has(cancelKey);

      // Only include future sessions that are not cancelled
      if (isAfter(sessionDateTime, now) && !isCancelled) {
        sessions.push({
          id: `regular-${invitation.id}-${sessionDateTime.toISOString()}`,
          invitationId: invitation.id,
          tutorId: invitation.tutorId,
          startTime: sessionDateTime,
          duration: invitation.duration,
          status: "booked",
          sessionType: "regular",
          location: invitation.location,
          studentId: studentId,
          tutorName: invitation.tutorName,
          tutorAvatar: invitation.tutorAvatar,
          tutorColor: invitation.color || invitation.tutorColor,
          description: invitation.description,
          isRecurring: true,
          dayOfWeek: invitation.dayOfWeek,
        });
      }

      // Move to next week
      currentDate = addWeeks(currentDate, 1);
    }
  }

  // Sort by start time
  return sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
}

/**
 * Combined function to fetch and generate regular sessions for the current user
 */
export async function getRegularSessions(): Promise<RegularSession[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  const invitations = await getRegularInvitations();
  const cancelledSessions = await getStudentCancelledSessions();
  return generateRecurringSessions(invitations, userId, cancelledSessions);
}

/**
 * Fetches all cancelled regular session dates for the current user
 */
export async function getStudentCancelledSessions(): Promise<CancelledSession[]> {
  const { userId } = await auth();

  if (!userId) {
    return [];
  }

  return db
    .select({
      id: cancelledRegularSessionsTable.id,
      invitationId: cancelledRegularSessionsTable.invitationId,
      cancelledDate: cancelledRegularSessionsTable.cancelledDate,
      reason: cancelledRegularSessionsTable.reason,
    })
    .from(cancelledRegularSessionsTable)
    .innerJoin(
      regularInvitationsTable,
      eq(cancelledRegularSessionsTable.invitationId, regularInvitationsTable.id)
    )
    .where(eq(regularInvitationsTable.studentClerkId, userId));
}

/**
 * Cancel a specific occurrence of a regular session
 */
export async function studentCancelSession(
  invitationId: number,
  cancelledDate: Date,
  reason?: string
): Promise<{ success?: boolean; message: string; status: number }> {
  const { userId } = await auth();

  if (!userId) {
    return { message: "Unauthorized", status: 401 };
  }

  // Verify the invitation belongs to the authenticated student
  const invitation = await db
    .select({
      id: regularInvitationsTable.id,
      studentClerkId: regularInvitationsTable.studentClerkId,
      tutorId: regularInvitationsTable.tutorId,
      dayOfWeek: regularInvitationsTable.dayOfWeek,
      startTime: regularInvitationsTable.startTime,
      duration: regularInvitationsTable.duration,
      location: regularInvitationsTable.location,
    })
    .from(regularInvitationsTable)
    .where(
      and(
        eq(regularInvitationsTable.id, invitationId),
        eq(regularInvitationsTable.studentClerkId, userId),
        eq(regularInvitationsTable.status, "accepted")
      )
    )
    .limit(1);

  if (invitation.length === 0) {
    return { message: "Regular schedule not found or not authorized", status: 404 };
  }

  // Check if the session is at least 24 hours away
  const now = new Date();
  const sessionDate = new Date(cancelledDate);
  const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilSession <= 24) {
    return {
      message: "Cannot cancel sessions within 24 hours of the start time",
      status: 400,
    };
  }

  // Check if this session is already cancelled
  const existingCancellation = await db
    .select({ id: cancelledRegularSessionsTable.id })
    .from(cancelledRegularSessionsTable)
    .where(
      and(
        eq(cancelledRegularSessionsTable.invitationId, invitationId),
        eq(cancelledRegularSessionsTable.cancelledDate, sessionDate)
      )
    )
    .limit(1);

  if (existingCancellation.length > 0) {
    return { message: "This session is already cancelled", status: 400 };
  }

  // Insert the cancellation record
  await db.insert(cancelledRegularSessionsTable).values({
    invitationId,
    cancelledDate: sessionDate,
    reason: reason || null,
  });

  // Get tutor details for email notification
  const tutor = await db
    .select({
      name: tutorsTable.name,
      email: tutorsTable.email,
    })
    .from(tutorsTable)
    .where(eq(tutorsTable.id, invitation[0].tutorId))
    .limit(1);

  if (tutor.length === 0) {
    return { success: true, message: "Session cancelled but tutor not found for notification", status: 200 };
  }

  // Get student name from Clerk
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const studentName = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.emailAddresses[0]?.emailAddress || "Student";

  // Send email notification to tutor
  try {
    await resend.emails.send({
      from: "Slovenščina Korak za Korakom <notifications@slovenscinakzk.com>",
      to: [tutor[0].email],
      subject: "Regular Session Cancelled",
      react: TutorSessionCancelEmail({
        tutorName: tutor[0].name,
        locale: "en",
        studentName,
        sessionDate: sessionDate,
        sessionDuration: invitation[0].duration,
        sessionType: "Regular Session",
        location: invitation[0].location,
        cancellationReason: reason,
      }),
    });
  } catch (emailError) {
    console.error("Error sending tutor notification email:", emailError);
    // Don't fail the action if email fails
  }

  return { success: true, message: "Session cancelled successfully", status: 200 };
}
