import { getSchedule, getTimeblocks, getTutors } from "@/actions/timeblocks";
import { getRegularSessions } from "@/actions/regulars";
import Calendar from "@/components/calendar/calendar";
import React from "react";
import {auth, clerkClient} from "@clerk/nextjs/server";

const CalendarPage = async () => {
  const schedule = await getSchedule();
  const timeblocks = await getTimeblocks();
  const tutors = await getTutors();
  const regularSessions = await getRegularSessions();
  const {userId} = await auth();

  if (schedule.status !== 200 || timeblocks.status !== 200 || tutors.status !== 200 || !userId) {
    return (
      <div className="text-red-500">
        Error: {schedule.error || timeblocks.error || tutors.error}
      </div>
    );
  }

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const preferences = clerkUser.privateMetadata.preferences as { preferredTutor?: number } | null | undefined;
  const preferredTutorDbId = preferences?.preferredTutor ?? null;
  const testSession = clerkUser.privateMetadata.testSession as { status?: string } | null | undefined;
  const testSessionStatus = testSession?.status ?? null;

  return (
    <div className="h-full w-full overflow-hidden">
      <Calendar
        studentId={userId}
        scheduleData={schedule.scheduleData}
        timeblocksData={timeblocks.timeblocks}
        tutorsData={tutors.tutors}
        regularSessionsData={regularSessions}
        preferredTutorDbId={preferredTutorDbId}
        testSessionStatus={testSessionStatus}
      />
    </div>
  );
};

export default CalendarPage;
