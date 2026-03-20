import Greeting from "@/components/dashboard/content/greeting";
import { db } from "@/db";
import {
  langClubBookingsTable,
  langClubTable,
  timeblocksTable,
  tutorsTable,
} from "@/db/schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {asc, eq, and, or, gt} from "drizzle-orm";
import React from "react";
import {getRegularSessions} from "@/actions/regulars";

import DashboardClient from "./_components/dashboard-client";
import DashboardStats from "./_components/dashboard-stats";
import UnifiedCalendar from "./_components/unified-calendar";
import WelcomeTestSessionDialog from "./_components/welcome-test-session-dialog";

const DashboardPage = async ({ params }) => {
  const { locale } = await params;
  const { userId } = await auth();

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const showWelcomeDialog = clerkUser.unsafeMetadata.showWelcomeDialog === true;

  // Fetch language club events
  const langClubEvents = await db
    .select({
      id: langClubTable.id,
      description: langClubTable.description,
      date: langClubTable.date,
      tutor: langClubTable.tutor,
      level: langClubTable.level,
      location: langClubTable.location,
      duration: langClubTable.duration,
      theme: langClubTable.theme,
      bookingId: langClubBookingsTable.id,
      bookingStatus: langClubBookingsTable.status,
    })
    .from(langClubBookingsTable)
    .where(
      and(
        eq(langClubBookingsTable.userId, userId),
        or(
          eq(langClubBookingsTable.status, "paid"),
          eq(langClubBookingsTable.status, "booked"),
        ),
      ),
    )
    .innerJoin(
      langClubTable,
      eq(langClubBookingsTable.eventId, langClubTable.id),
    )
    .orderBy(asc(langClubTable.date));

  // Fetch personal tutoring sessions
  const personalSessions = await db
    .select({
      id: timeblocksTable.id,
      tutorId: timeblocksTable.tutorId,
      startTime: timeblocksTable.startTime,
      duration: timeblocksTable.duration,
      status: timeblocksTable.status,
      sessionType: timeblocksTable.sessionType,
      location: timeblocksTable.location,
      studentId: timeblocksTable.studentId,
      tutorName: tutorsTable.name,
      tutorAvatar: tutorsTable.avatar,
      tutorColor: tutorsTable.color,
    })
    .from(timeblocksTable)
    .where(and(
      eq(timeblocksTable.studentId, userId),
      eq(timeblocksTable.status, "booked"),
      gt(timeblocksTable.startTime, new Date()))
    )
    .innerJoin(tutorsTable, eq(timeblocksTable.tutorId, tutorsTable.id))
    .orderBy(asc(timeblocksTable.startTime));

  // Fetch regular sessions (automatically filters out cancelled sessions)
  const regularSessions = await getRegularSessions();

  return (
    <main className="w-full h-full flex flex-col gap-8 p-0 md:p-10 lg:p-12">
      {showWelcomeDialog && <WelcomeTestSessionDialog open={true} />}
      <div className="px-4 pt-8 md:p-0 flex-shrink-0">
        <Greeting />
      </div>

      {/* Stats Cards */}
      <DashboardStats
        langClubEvents={langClubEvents}
        personalSessions={personalSessions}
        regularSessions={regularSessions}
      />

      {/* Main Content: Calendar and Events */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 min-h-0">
        <div className="lg:col-span-2">
          <UnifiedCalendar
            langClubEvents={langClubEvents}
            personalSessions={personalSessions}
            regularSessions={regularSessions}
            locale={locale}
          />
        </div>
        <div className="lg:col-span-1 p-4">
          <DashboardClient
            langClubEvents={langClubEvents}
            personalSessions={personalSessions}
            regularSessions={regularSessions}
            locale={locale}
          />
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
