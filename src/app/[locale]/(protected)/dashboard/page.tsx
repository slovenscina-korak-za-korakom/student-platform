import Greeting from "@/components/dashboard/content/greeting";
import { auth, clerkClient } from "@clerk/nextjs/server";
import React from "react";
import { getRegularSessions } from "@/actions/regulars";
import { getDashboardLangClubEvents } from "@/actions/stripe-actions";
import { getDashboardPersonalSessions } from "@/actions/timeblocks";

import DashboardClient from "./_components/dashboard-client";
import DashboardStats from "./_components/dashboard-stats";
import UnifiedCalendar from "./_components/unified-calendar";
import WelcomeTestSessionDialog from "./_components/welcome-test-session-dialog";

const DashboardPage = async ({ params }) => {
  const { locale } = await params;
  const { userId } = await auth();

  const [clerkUser, langClubResult, personalResult, regularSessions] = await Promise.all([
    clerkClient().then((c) => c.users.getUser(userId)),
    getDashboardLangClubEvents(),
    getDashboardPersonalSessions(),
    getRegularSessions(),
  ]);

  const showWelcomeDialog = clerkUser.unsafeMetadata.showWelcomeDialog === true;
  const langClubEvents = langClubResult.status === 200 ? langClubResult.events : [];
  const personalSessions = personalResult.status === 200 ? personalResult.sessions : [];

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