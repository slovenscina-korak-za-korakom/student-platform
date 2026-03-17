"use client";
import React, { useMemo, useState } from "react";
import NextEventCard from "./next-event-card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { IconCalendar } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { cancelBooking } from "@/actions/stripe-actions";
import { cancelSession } from "@/actions/timeblocks";
import RescheduleDialog from "./reschedule-dialog";
import { DayEventsSheet, type DayEventItem } from "./day-events-sheet";
import {LangClubEvent, PersonalSession, RegularSession, UnifiedEvent} from "@/types/interfaces";
import { SESSION_COLORS, hexToRgba } from "@/lib/session-colors";


interface DashboardClientProps {
  langClubEvents: LangClubEvent[];
  personalSessions: PersonalSession[];
  regularSessions: RegularSession[];
  locale: string;
}

const DashboardClient = ({
  langClubEvents,
  personalSessions,
  regularSessions,
  locale,
}: DashboardClientProps) => {
  const t = useTranslations("dashboard.all-scheduled-events");

  // Combine and sort all events by date
  const allEvents: UnifiedEvent[] = useMemo(() => {
    const now = new Date();
    const events: UnifiedEvent[] = [];

    // Add language club events
    langClubEvents.forEach((event) => {
      if (new Date(event.date) > now) {
        events.push({
          id: event.id,
          type: "language-club",
          date: new Date(event.date),
          tutor: event.tutor,
          location: event.location,
          duration: event.duration,
          theme: event.theme,
          bookingId: event.bookingId,
          bookingStatus: event.bookingStatus,
          level: event.level,
        });
      }
    });

    // Add personal sessions
    personalSessions.forEach((session) => {
      if (new Date(session.startTime) > now && session.status === "booked") {
        events.push({
          id: session.id,
          type: "personal",
          date: new Date(session.startTime),
          tutor: session.tutorName,
          location: session.location,
          duration: session.duration,
          theme: session.sessionType,
          tutorColor: session.tutorColor,
          sessionType: session.sessionType,
        });
      }
    });

    // Add regular sessions (they're already filtered to future dates in the server action)
    regularSessions.forEach((session) => {
      events.push({
        id: session.id,
        type: "regular",
        date: new Date(session.startTime),
        tutor: session.tutorName,
        location: session.location,
        duration: session.duration,
        theme: session.sessionType,
        tutorColor: session.tutorColor,
        sessionType: session.sessionType,
        isRecurring: true,
        invitationId: session.invitationId,
      });
    });

    // Sort by date (earliest first)
    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [langClubEvents, personalSessions, regularSessions]);

  const nextEvent = allEvents.length > 0 ? allEvents[0] : null;

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
      {nextEvent ? (
        <div className="flex flex-col gap-4">
          <NextEventCard event={nextEvent} locale={locale} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-border/40 dark:border-white/10 bg-white dark:bg-[#1a1a1a] shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
          <div className="w-16 h-16 mb-4 rounded-full bg-muted/30 flex items-center justify-center">
            <IconCalendar className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("no-future-events")}
          </h3>
          <p className="text-sm text-muted-foreground text-center mb-6 max-w-[280px]">
            {t("upcoming-events")}
          </p>
          <Button
            onClick={() => window.location.href = '/language-club'}
            variant="outline"
            className="transition-all duration-200"
            style={{
              borderColor: hexToRgba(SESSION_COLORS["language-club"], 0.5),
              color: SESSION_COLORS["language-club"],
            }}
          >
            {t("browse-events")}
          </Button>
        </div>
      )}
      <div className="inline-flex gap-2 w-full items-center overflow-hidden">
        <p className="text-sm text-muted-foreground w-full flex-1 text-nowrap">
          {t("message", {
            count: allEvents.length,
          })}
        </p>
        {/* View All Scheduled Dialog */}
        {allEvents.length > 0 && (
          <ViewAllScheduledSheet events={allEvents} locale={locale} />
        )}

        <Separator />
      </div>
    </div>
  );
};

export default DashboardClient;

function ViewAllScheduledSheet({
  events,
  locale,
}: {
  events: UnifiedEvent[];
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState<number | string | null>(null);
  const [rescheduleEvent, setRescheduleEvent] = useState<{
    id: number | string;
    type: "language-club" | "personal" | "regular";
    bookingId?: number;
  } | null>(null);
  const t = useTranslations("dashboard.all-scheduled-events");
  const router = useRouter();

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => a.date.getTime() - b.date.getTime()),
    [events],
  );

  const handleCancel = async (event: DayEventItem) => {
    setIsCancelling(event.id);
    try {
      let response;
      if (event.type === "regular") {
        toast.error("Regular sessions cannot be cancelled individually");
        setIsCancelling(null);
        return;
      } else if (event.type === "language-club" && event.bookingId) {
        response = await cancelBooking(event.bookingId);
      } else if (event.type === "personal" && typeof event.id === "number") {
        response = await cancelSession(event.id);
      } else {
        toast.error("Cannot cancel this event");
        setIsCancelling(null);
        return;
      }

      if (response?.success) {
        router.refresh();
        toast.success(response.message || "Event cancelled successfully");
      } else {
        toast.error(response?.error || "Failed to cancel event");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel event");
    } finally {
      setIsCancelling(null);
    }
  };

  const handleReschedule = (event: DayEventItem) => {
    if (event.type === "language-club" && event.bookingId) {
      setRescheduleEvent({ id: event.id, type: "language-club", bookingId: event.bookingId });
    }
  };

  return (
    <>
      <Button variant="link" className="p-0 m-0 cursor-pointer" onClick={() => setOpen(true)}>
        {t("link")}
      </Button>

      <DayEventsSheet
        open={open}
        onOpenChange={setOpen}
        selectedDate={undefined}
        events={sortedEvents as DayEventItem[]}
        locale={locale}
        isCancelling={isCancelling}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
        headerTitle={t("event-view-card.title")}
        headerHeading={t("event-view-card.title")}
        headerChip={t("message", { count: sortedEvents.length })}
        showFullDate
      />

      {/* Reschedule Dialog */}
      {rescheduleEvent &&
        rescheduleEvent.type === "language-club" &&
        rescheduleEvent.bookingId &&
        (() => {
          const event = sortedEvents.find(
            (e) => e.id === rescheduleEvent.id && e.type === "language-club",
          );
          if (!event || event.type !== "language-club" || typeof event.id !== "number") return null;

          return (
            <RescheduleDialog
              open={!!rescheduleEvent}
              onOpenChange={(open) => { if (!open) setRescheduleEvent(null); }}
              currentEvent={{
                id: event.id as number,
                theme: event.theme || "",
                date: event.date,
                tutor: event.tutor || "",
                location: event.location || "",
                duration: event.duration || 45,
                maxBooked: 10,
                peopleBooked: 0,
                level: event.level || "",
                price: 0,
              }}
              bookingId={rescheduleEvent.bookingId}
              locale={locale}
            />
          );
        })()}
    </>
  );
}
