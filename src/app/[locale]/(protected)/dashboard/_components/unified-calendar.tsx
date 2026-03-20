"use client";
import {useMemo, useState, useRef, useCallback, useEffect} from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import {
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { isSameDay } from "date-fns";
import { cancelBooking } from "@/actions/stripe-actions";
import { cancelSession } from "@/actions/timeblocks";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import RescheduleDialog from "./reschedule-dialog";
import "@/components/calendar/calendar-styles.css";
import {useSidebar} from "@/components/ui/sidebar";
import {LangClubEvent, PersonalSession, RegularSession} from "@/types/interfaces";
import { SESSION_COLORS, getSessionColor, hexToRgba } from "@/lib/session-colors";
import { DayEventsSheet, type DayEventItem } from "./day-events-sheet";

interface UnifiedCalendarProps {
  langClubEvents: LangClubEvent[];
  personalSessions: PersonalSession[];
  regularSessions: RegularSession[];
  locale: string;
}

const UnifiedCalendar = ({
  langClubEvents,
  personalSessions,
  regularSessions,
  locale,
}: UnifiedCalendarProps) => {
  const fullLocale = useLocale();
  const {state} = useSidebar();
  const tD = useTranslations("dashboard.calendar");
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  const [calendarTitle, setCalendarTitle] = useState("Calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(),
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState<number | string | null>(null);
  const [rescheduleEvent, setRescheduleEvent] = useState<{
    id: number | string;
    type: "language-club" | "personal" | "regular";
    bookingId?: number;
  } | null>(null);

  // Transform events to FullCalendar format
  const calendarEvents = useMemo(() => {
    const events: Array<{
      id: string;
      title: string;
      start: Date;
      end: Date;
      extendedProps: Record<string, unknown>;
      backgroundColor: string;
      borderColor: string;
      textColor: string;
      classNames?: string[];
    }> = [];

    // Add language club events
    langClubEvents.forEach((event) => {
      const eventDate = new Date(event.date);
      events.push({
        id: `lang-club-${event.id}`,
        title: event.theme,
        start: eventDate,
        end: new Date(eventDate.getTime() + (event.duration || 45) * 60000),
        extendedProps: {
          type: "language-club",
          event: event,
          tutor: event.tutor,
          location: event.location,
          duration: event.duration,
          theme: event.theme,
        },
        backgroundColor: SESSION_COLORS["language-club"],
        borderColor: SESSION_COLORS["language-club"],
        textColor: "#ffffff",
        classNames: ["lang-club-event"],
      });
    });

    // Add personal sessions (includes test sessions)
    personalSessions.forEach((session) => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + session.duration * 60000);
      const isPast = endTime < new Date();
      const sessionColor = getSessionColor(session.sessionType);
      events.push({
        id: `personal-${session.id}`,
        title: session.sessionType,
        start: startTime,
        end: endTime,
        extendedProps: {
          type: "personal",
          session: session,
          tutor: session.tutorName,
          location: session.location,
          duration: session.duration,
        },
        backgroundColor: isPast ? hexToRgba(sessionColor, 0.7) : sessionColor,
        borderColor: isPast ? hexToRgba(sessionColor, 0.7) : sessionColor,
        textColor: "#ffffff",
        classNames: ["personal-event"],
      });
    });

    // Add regular sessions
    regularSessions.forEach((session) => {
      const startTime = new Date(session.startTime);
      const endTime = new Date(startTime.getTime() + session.duration * 60000);
      events.push({
        id: session.id,
        title: session.sessionType,
        start: startTime,
        end: endTime,
        extendedProps: {
          type: "regular",
          session: session,
          tutor: session.tutorName,
          location: session.location,
          duration: session.duration,
          tutorColor: session.tutorColor,
          isRecurring: true,
        },
        backgroundColor: new Date(session.startTime) < new Date() ? hexToRgba(SESSION_COLORS.regular, 0.7) : SESSION_COLORS.regular,
        borderColor: new Date(session.startTime) < new Date() ? hexToRgba(SESSION_COLORS.regular, 0.7) : SESSION_COLORS.regular,
        textColor: "#ffffff",
        classNames: ["regular-event"],
      });
    });

    return events;
  }, [langClubEvents, personalSessions, regularSessions]);

  // Combine all events for dialog display
  const allEvents = useMemo(() => {
    const events: Array<{
      id: number | string;
      type: "language-club" | "personal" | "regular";
      date: Date;
      tutor?: string;
      theme?: string;
      location?: string;
      duration?: number;
      tutorColor?: string;
      description?: string;
      level?: string;
      bookingId?: number;
      bookingStatus?: string;
      isRecurring?: boolean;
      invitationId?: number;
    }> = [];

    // Add language club events
    langClubEvents.forEach((event) => {
      events.push({
        ...event,
        type: "language-club" as const,
        date: new Date(event.date),
      });
    });

    // Add personal sessions
    personalSessions.forEach((session) => {
      events.push({
        id: session.id,
        type: "personal" as const,
        date: new Date(session.startTime),
        tutor: session.tutorName,
        theme: session.sessionType,
        location: session.location,
        duration: session.duration,
        tutorColor: session.tutorColor,
      });
    });

    // Add regular sessions
    regularSessions.forEach((session) => {
      events.push({
        id: session.id,
        type: "regular" as const,
        date: new Date(session.startTime),
        tutor: session.tutorName,
        theme: session.sessionType,
        location: session.location,
        duration: session.duration,
        tutorColor: session.tutorColor,
        description: session.description,
        isRecurring: true,
        invitationId: session.invitationId,
      });
    });

    return events;
  }, [langClubEvents, personalSessions, regularSessions]);

  const handleDateClick = (arg: { date: Date | string }) => {
    const clickedDate =
      typeof arg.date === "string" ? new Date(arg.date) : arg.date;
    setSelectedDate(clickedDate);
    setIsSheetOpen(true);
  };

  // Update calendar dimensions when sidebar state changes
  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      // Add a small delay to allow sidebar transition to complete
      const timer = setTimeout(() => {
        calendarApi.updateSize();
      }, 300); // Match this with your sidebar transition duration
      return () => clearTimeout(timer);
    }
  }, [state]);

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

      if (response?.status === 200) {
        router.refresh();
        toast.success(response.message || "Event cancelled successfully");
        setIsSheetOpen(false);
      } else {
        toast.error(response?.message || "Failed to cancel event");
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
      // Close the rescheduling confirmation dialog first
      setRescheduleEvent({
        id: event.id,
        type: "language-club",
        bookingId: event.bookingId,
      });
    }
  };

  const eventsOnSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    // Compare dates in the client's local timezone (same as FullCalendar displays)
    return allEvents.filter((event) => {
      return isSameDay(new Date(event.date), selectedDate);
    });
  }, [selectedDate, allEvents]);

  const updateCalendarTitle = useCallback(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      setCalendarTitle(view.title);
    }
  }, []);

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.today();
    updateCalendarTitle();
  };

  const goToPrev = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.prev();
    updateCalendarTitle();
  };

  const goToNext = () => {
    const calendarApi = calendarRef.current?.getApi();
    calendarApi?.next();
    updateCalendarTitle();
  };

  useEffect(() => {
    updateCalendarTitle();
  }, [updateCalendarTitle]);

  return (
    <div className="h-full rounded-2xl animate-in fade-in slide-in-from-bottom-5 duration-700 delay-150">
      <Card className="h-full flex flex-col overflow-hidden p-1 py-4 min-h-[500px] bg-background border border-border/40 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)]">
        <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col p-0">
          <div className="h-full flex flex-col">
            {/* Calendar Controls */}
            <div className="flex-shrink-0 px-6 pt-2 pb-3 flex items-center justify-between border-b border-border/30">
              <h3 className="text-lg md:text-xl font-semibold text-foreground">
                {calendarTitle}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrev}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-label="Previous month"
                >
                  <IconChevronLeft className="w-4 h-4 text-muted-foreground" />
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="border-border/50 text-foreground bg-background hover:bg-muted/50 transition-all duration-200 font-medium"
                >
                  {tD("today-button") || "Today"}
                </Button>
                <button
                  onClick={goToNext}
                  className="p-2 hover:bg-muted/50 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-label="Next month"
                >
                  <IconChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            {/* FullCalendar Component */}
            <div className="flex-1 min-h-0 overflow-hidden px-3 pb-2">
              <FullCalendar
                ref={calendarRef}
                locale={fullLocale}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={false}
                height="100%"
                events={calendarEvents}
                dateClick={handleDateClick}
                editable={false}
                selectable={false}
                dayMaxEvents={false}
                moreLinkClick="popover"
                weekNumbers={false}
                weekends={true}
                firstDay={1}
                eventContent={(eventInfo) => {
                  // Just show a simple dot indicator at the bottom of the day
                  return (
                    <div className="flex items-center justify-center w-full h-full min-h-[6px]">
                      <div
                        className="rounded-full flex-shrink-0 shadow-sm"
                        style={{
                          width: "6px",
                          height: "6px",
                          backgroundColor: eventInfo.event.backgroundColor,
                          border: "none",
                        }}
                      />
                    </div>
                  );
                }}
              />
            </div>
          </div>
        </CardContent>

        {/* Day Events Sheet */}
        <DayEventsSheet
          open={isSheetOpen}
          onOpenChange={(open) => {
            setIsSheetOpen(open);
            if (!open) setRescheduleEvent(null);
          }}
          selectedDate={selectedDate}
          events={eventsOnSelectedDay}
          locale={locale}
          isCancelling={isCancelling}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
        />

        {/* Reschedule Dialog */}
        {rescheduleEvent &&
          rescheduleEvent.type === "language-club" &&
          rescheduleEvent.bookingId &&
          (() => {
            const event = eventsOnSelectedDay.find(
              (e) => e.id === rescheduleEvent.id && e.type === "language-club",
            );
            if (!event || event.type !== "language-club" || typeof event.id !== "number") return null;

            const currentEvent = {
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
            };

            return (
              <RescheduleDialog
                open={!!rescheduleEvent}
                onOpenChange={(open) => {
                  if (!open) setRescheduleEvent(null);
                }}
                currentEvent={currentEvent}
                bookingId={rescheduleEvent.bookingId}
                locale={locale}
              />
            );
          })()}
      </Card>
    </div>
  );
};

export default UnifiedCalendar;
