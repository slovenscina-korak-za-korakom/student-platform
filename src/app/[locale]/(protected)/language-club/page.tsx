import React from "react";
import LangComponents from "./_components/lang-components";
import BookingToast from "./_components/booking-toast";
import {db} from "@/db";
import {langClubTable} from "@/db/schema";
import {eq} from "drizzle-orm";

const LanguageClubPage = async ({params, searchParams}) => {
  const {locale} = await params;
  const {success, canceled, session_id} = await searchParams;

  // Fetch events from database
  const events = await db.query.langClubTable.findMany({
    orderBy: (langClubTable, {asc}) => [asc(langClubTable.date)],
  });

  // Handle success state - will be shown in dialog
  let bookedEvent = null;

  if (success && session_id) {
    try {
      // Get session details from Stripe to find the correct event
      const sessionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/get-session?session_id=${session_id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        const eventId = parseInt(sessionData.eventId);

        bookedEvent = events.find((event) => event.id === eventId);

        // Update the event with the new number of people booked
        await db
          .update(langClubTable)
          .set({
            peopleBooked: bookedEvent.maxBooked - bookedEvent.spotsLeft + 1,
          })
          .where(eq(langClubTable.id, bookedEvent.id));
      }
    } catch (error) {
      console.error("Error fetching session details:", error);
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <BookingToast canceled={canceled}/>
      <LangComponents
        events={events}
        locale={locale}
        bookedEvent={bookedEvent}
      />
    </div>
  );
};

export default LanguageClubPage;
