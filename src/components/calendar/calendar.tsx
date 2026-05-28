"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import { EventContentArg, CalendarApi } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import { TutoringSession, EventClickArg } from "@/components/calendar/types";
import { TutorData, ScheduleData, DaySchedule, ScheduleTimeSlot, TimeblockData, RegularSession, AvailableSlotData } from "@/types/interfaces";
import { CalendarControls } from "@/components/calendar/calendar-controls";
import { EventSheet } from "@/components/calendar/event-sheet";
import { NoSlotsOverlay } from "@/components/calendar/no-slots-overlay";
import "@/components/calendar/calendar-styles.css";
import {useLocale, useTranslations} from "next-intl";
import {fromZonedTime} from "date-fns-tz";
import { useCalendarResize } from "@/hooks/use-calendar-resize";
import { SESSION_COLORS, getSessionColor } from "@/lib/session-colors";
// Transform database tutors to the format expected by the calendar
const transformTutors = (tutorsData: TutorData[]) => {
  return tutorsData.map((tutor) => ({
    id: tutor.id,
    name: tutor.name,
    avatar: tutor.avatar,
    color: tutor.color,
    email: tutor.email,
    phone: tutor.phone,
    bio: tutor.bio,
  }));
};

// Generate available time slots from tutor schedules
const generateAvailableSlots = (
  schedulesData: ScheduleData[],
  tutorsData: TutorData[],
) => {
  const availableSlots: TutoringSession[] = [];
  const now = new Date();
  // Work in UTC to match DB-stored UTC times
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

  schedulesData.forEach((schedule) => {
    const tutor = tutorsData.find((t) => t.clerkId === schedule.ownerId);
    if (!tutor) return;

    try {
      const scheduleData: DaySchedule[] =
        typeof schedule.schedule === "string"
          ? JSON.parse(schedule.schedule)
          : schedule.schedule;

      // Get the day of the week for today in UTC (0 = Sunday, 1 = Monday, etc.)
      let dayOfTheWeek = todayUTC.getUTCDay();

      // Generate slots for each day of the week for the next 4 weeks
      for (let week = 0; week < 4; week++) {
        for (let day = 0; day < 7; day++) {
          const currentDate = new Date(todayUTC);
          currentDate.setUTCDate(currentDate.getUTCDate() + week * 7 + day);

          // Find the schedule for this day (0 = Sunday, 1 = Monday, etc.)
          const daySchedule = scheduleData.find(
            (scheduleDay: DaySchedule) => scheduleDay.day === dayOfTheWeek % 7,
          );
          dayOfTheWeek++; // Move to the next day of the week

          if (
            daySchedule &&
            daySchedule.timeSlots &&
            daySchedule.timeSlots.length > 0
          ) {
            daySchedule.timeSlots.forEach((timeSlot: ScheduleTimeSlot) => {
              // Skip "regular" session types - they are handled separately and never bookable
              if (timeSlot.sessionType === "regular") return;

              // Create the datetime as UTC (DB stores times as UTC)
              const year = currentDate.getUTCFullYear();
              const month = String(currentDate.getUTCMonth() + 1).padStart(2, '0');
              const dayNum = String(currentDate.getUTCDate()).padStart(2, '0');

              // Convert wall-clock time in the tutor's timezone to UTC
              const timezone = schedule.timezone || 'UTC';
              const slotStart = fromZonedTime(`${year}-${month}-${dayNum}T${timeSlot.startTime}:00`, timezone);

              const slotEnd = new Date(
                slotStart.getTime() + timeSlot.duration * 60000,
              );

              // Skip if this slot is in the past
              if (slotStart < now) return;

              const duration =
                (slotEnd.getTime() - slotStart.getTime()) / 60000; // in minutes

              availableSlots.push({
                id: `available-${tutor.id}-${slotStart.getTime()}`,
                tutorId: tutor.id,
                tutorName: tutor.name,
                startTime: slotStart,
                endTime: slotEnd,
                duration: duration,
                status: "available",
                sessionType: timeSlot.sessionType,
                location: timeSlot.location ?? "Online", // Default location
                description: "Available for booking",
              });
            });
          }
        }
      }
    } catch {
      // Handle schedule parsing errors silently
    }
  });

  return availableSlots;
};

// Transform database timeblocks to TutoringSession format (for booked sessions)
const transformTimeblocksToSessions = (
  timeblocksData: TimeblockData[],
  tutorsData: TutorData[],
) => {
  return timeblocksData.map((timeblock) => {
    const tutor = tutorsData.find((t) => t.id === timeblock.tutorId);
    const startTime = new Date(timeblock.startTime);
    const endTime = new Date(startTime.getTime() + timeblock.duration * 60000); // duration in minutes

    return {
      id: timeblock.id.toString(),
      tutorId: timeblock.tutorId.toString(),
      tutorName: tutor?.name || "Unknown Tutor",
      startTime: startTime,
      endTime: endTime,
      duration: timeblock.duration,
      sessionType: timeblock.sessionType,
      location: timeblock.location,
      status: timeblock.status,
      description: timeblock.description,
      studentId: timeblock.studentId,
      videoCallUrl: timeblock.videoCallUrl,
    };
  });
};

interface CalendarProps {
  scheduleData: ScheduleData[];
  timeblocksData: TimeblockData[];
  tutorsData: TutorData[];
  studentId: string;
  regularSessionsData?: RegularSession[];
  availableDbSlotsData?: AvailableSlotData[];
  preferredTutorDbId?: number | null;
  testSessionStatus?: string | null;
}

// Map FullCalendar view names to URL-friendly names
const viewNameToUrl = (viewName: string): string => {
  const mapping: Record<string, string> = {
    dayGridMonth: "month",
    timeGridWeek: "week",
    timeGridDay: "day",
    timeGrid2Day: "2days",
    timeGrid3Day: "3days",
    listWeek: "list",
  };
  return mapping[viewName] || "month";
};

// Map URL-friendly names back to FullCalendar view names
const urlToViewName = (urlView: string | null): string => {
  const mapping: Record<string, string> = {
    month: "dayGridMonth",
    week: "timeGridWeek",
    day: "timeGridDay",
    "2days": "timeGrid2Day",
    "3days": "timeGrid3Day",
    list: "listWeek",
  };
  return mapping[urlView || ""] || "dayGridMonth";
};

export default function Calendar({
  scheduleData,
  timeblocksData,
  tutorsData,
  studentId,
  regularSessionsData = [],
  availableDbSlotsData = [],
  preferredTutorDbId = null,
  testSessionStatus = null,
}: CalendarProps) {
  const locale = useLocale();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("calendar.event-type")
  // Transform the data from a database
  const transformedTutors = transformTutors(tutorsData);

  // Generate available slots from schedules and merge with DB-published slots
  const availableSlots = useMemo(() => {
    const scheduleSlots = generateAvailableSlots(scheduleData, tutorsData);

    const dbSlots: TutoringSession[] = availableDbSlotsData.map((slot) => {
      const tutor = tutorsData.find((t) => t.id === slot.tutorId);
      const startTime = new Date(slot.startTime);
      const endTime = new Date(startTime.getTime() + slot.duration * 60000);
      return {
        id: `db-slot-${slot.id}`,
        tutorId: slot.tutorId,
        tutorName: tutor?.name ?? "Unknown Tutor",
        startTime,
        endTime,
        duration: slot.duration,
        status: "available",
        sessionType: slot.sessionType,
        location: slot.location,
        description: "Available for booking",
        videoCallUrl: slot.videoCallUrl,
      };
    });

    // DB slots take precedence; drop schedule slots that overlap with a DB slot
    return [
      ...dbSlots,
      ...scheduleSlots.filter((schedSlot) =>
        !dbSlots.some(
          (dbSlot) =>
            String(dbSlot.tutorId) === String(schedSlot.tutorId) &&
            schedSlot.startTime < dbSlot.endTime &&
            schedSlot.endTime > dbSlot.startTime,
        )
      ),
    ];
  }, [scheduleData, tutorsData, availableDbSlotsData]);

  // Get booked sessions (only future ones)
  const bookedSessions = transformTimeblocksToSessions(
    timeblocksData,
    tutorsData,
  // ).filter((session) => (session.startTime >= new Date() && session.status === "booked" ));
).filter((session) => (session.startTime >= new Date()));

  // Transform regular sessions to TutoringSession format
  const regularSessions: TutoringSession[] = regularSessionsData.map((session) => ({
    id: session.id,
    tutorId: session.tutorId,
    tutorName: session.tutorName,
    startTime: new Date(session.startTime),
    endTime: new Date(new Date(session.startTime).getTime() + session.duration * 60000),
    duration: session.duration,
    sessionType: "regular",
    location: session.location,
    status: "regular", // Use "regular" to distinguish from "booked"
    description: session.description || "",
    isRecurring: true,
    invitationId: session.invitationId,
    studentId: session.studentId,
  }));

  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<TutoringSession | null>(
    null,
  );
  const [isEventSheetOpen, setIsEventSheetOpen] = useState(false);
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("Calendar");

  // Initialize view from URL or default to month
  const urlView = searchParams.get("view");
  const initialView = urlToViewName(urlView);
  const [currentView, setCurrentView] = useState(initialView);

  const [showWeekends, setShowWeekends] = useState(true);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(preferredTutorDbId ?? null);
  const [showBookedSessions, setShowBookedSessions] = useState(true);

  // Filter events based on the selected tutor or booked events
  const events = useMemo(() => {
    // Get booked events for the student (including regular sessions)
    if (showBookedSessions) {
      const personalBooked = bookedSessions.filter((event) => event.studentId === studentId);
      // Combine personal booked sessions with regular sessions
      return [...personalBooked, ...regularSessions];
    }

    // Filter out available slots that overlap with booked sessions
    const filteredAvailableSlots = availableSlots.filter((slot) => {
      // Filter test slots based on eligibility and preferred tutor
      if (slot.sessionType === "test") {
        // Hide if already used or currently booked
        if (testSessionStatus === "completed" || testSessionStatus === "booked") return false;
        // Only show from preferred tutor; hide if no preferred tutor set
        if (!preferredTutorDbId || Number(slot.tutorId) !== preferredTutorDbId) return false;
      }

      // Check if this slot overlaps with any booked session for the same tutor
      const isBooked = bookedSessions.some((booked) => {
        const sameTutor = String(slot.tutorId) === String(booked.tutorId);
        // Time overlap: slot starts before booked ends AND slot ends after booked starts
        const timeOverlap = slot.startTime < booked.endTime && slot.endTime > booked.startTime;

        // If the session is cancelled, only hide the slot from the student who cancelled it
        // Everyone else should see it as available
        if (booked.status === "cancelled") {
          return sameTutor && timeOverlap && booked.studentId === studentId;
        }

        // For active booked sessions, hide the slot from everyone
        return sameTutor && timeOverlap;
      });
      return !isBooked;
    });

    if (selectedTutorId === null) {
      return filteredAvailableSlots;
    } else {
      return filteredAvailableSlots.filter(
        (event: TutoringSession) => event.tutorId === selectedTutorId,
      );
    }
  }, [
    selectedTutorId,
    preferredTutorDbId,
    availableSlots,
    showBookedSessions,
    bookedSessions,
    studentId,
    regularSessions,
    testSessionStatus,
  ]);

  // Determine if we should show the no slots overlay and what message to display
  const noSlotsOverlay = useMemo(() => {
    // Don't show overlay when viewing booked sessions
    if (showBookedSessions) {
      return null;
    }

    // Check if a specific tutor is selected and has no available slots
    if (selectedTutorId !== null && events.length === 0) {
      const tutor = transformedTutors.find((t) => t.id === selectedTutorId);
      return {
        type: "tutor",
        tutor: tutor?.name
      };
    }

    // Check if no tutors have any available slots
    if (selectedTutorId === null && availableSlots.length === 0) {
      return {
        type: "all",
        tutor: null
      };
    }

    return null;
  }, [
    showBookedSessions,
    selectedTutorId,
    events.length,
    availableSlots.length,
    transformedTutors,
  ]);
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useCalendarResize(calendarRef);
  const isUpdatingViewRef = useRef(false);

  // Update URL parameters when view or other state changes
  const updateURLParams = useCallback(
    (updates: { view?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (updates.view !== undefined) {
        params.set("view", viewNameToUrl(updates.view));
      }

      window.history.pushState(null, "", `${pathname}?${params.toString()}`);
    },
    [searchParams, pathname],
  );

  // Initialize the calendar from URL on mount and sync with URL changes
  useEffect(() => {
    // Don't update if we're in the middle of a programmatic view change
    if (isUpdatingViewRef.current) return;

    const urlView = searchParams.get("view");
    const viewName = urlToViewName(urlView);

    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    // Only update if different from the current view
    if (viewName !== currentView) {
      // Small delay to ensure the calendar is fully mounted
      const timer = setTimeout(() => {
        calendarApi.changeView(viewName);
        setCurrentView(viewName);
        updateCalendarTitle();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Even if the view matches, update title
      const timer = setTimeout(() => {
        updateCalendarTitle();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [searchParams, currentView]); // React to URL changes (including initial mount)

  const changeView = useCallback(
    (viewName: string) => {
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        isUpdatingViewRef.current = true;
        calendarApi.changeView(viewName);
        setCurrentView(viewName);
        updateCalendarTitle();
        // Update URL parameter
        updateURLParams({ view: viewName });
        // Reset flag after a brief delay
        setTimeout(() => {
          isUpdatingViewRef.current = false;
        }, 200);
      }
    },
    [updateURLParams],
  );

  const handleMoreEventsClick = useCallback(
    (date: Date) => {

      // Find the start of the week (Monday) for the clicked date
      // FullCalendar typically uses Monday as the start of the week
      const startOfWeek = new Date(date);
      const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Adjust to Monday start (if Sunday, go back 6 days; otherwise go back to Monday)
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      startOfWeek.setDate(startOfWeek.getDate() - daysToSubtract);

      // Set the calendar-to-week view and navigate to that week
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        // Navigate to the specific date first
        calendarApi.gotoDate(startOfWeek);
        // Use the existing changeView function to properly update the state
        changeView("timeGridWeek");
      }
    },
    [changeView],
  );

  // Handle more events clicks
  useEffect(() => {
    const handleMoreEventsClickEvent = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.classList.contains("fc-more-link")) {
        event.preventDefault();
        event.stopPropagation();

        // Get the date from the more link
        const dayEl = target.closest(".fc-daygrid-day");
        if (dayEl) {
          const dateStr = dayEl.getAttribute("data-date");
          if (dateStr) {
            // Parse the date string and create a proper Date object
            const date = new Date(dateStr + "T00:00:00");
            handleMoreEventsClick(date);
          }
        }
      }
    };

    // Add an event listener to the calendar container
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const calendarEl = (calendarApi as CalendarApi & { el: HTMLElement }).el;
      if (calendarEl) {
        calendarEl.addEventListener("click", handleMoreEventsClickEvent);
        return () => {
          calendarEl.removeEventListener("click", handleMoreEventsClickEvent);
        };
      }
    }
  }, [handleMoreEventsClick]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleEventClick = (arg: EventClickArg) => {
    // Convert FullCalendar event back to TutoringSession
    const session: TutoringSession = {
      id: arg.event.id,
      tutorId: arg.event.extendedProps.tutorId,
      tutorName: arg.event.extendedProps.tutor,
      startTime: new Date(arg.event.start!),
      endTime: new Date(arg.event.end!),
      duration: arg.event.extendedProps.duration,
      sessionType: arg.event.extendedProps.sessionType,
      location: arg.event.extendedProps.location,
      status: arg.event.extendedProps.status,
      description: arg.event.extendedProps.description,
      videoCallUrl: arg.event.extendedProps.videoCallUrl,
      // Regular session specific fields
      isRecurring: arg.event.extendedProps.isRecurring,
      invitationId: arg.event.extendedProps.invitationId,
      studentId: arg.event.extendedProps.studentId,
    };
    setSelectedEvent(session);
    setIsEventSheetOpen(true);
  };

  const handleDateClick = useCallback(
    (arg: { date: Date }) => {
      if (!isMobile || currentView !== "dayGridMonth") return;
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.gotoDate(arg.date);
        changeView("timeGridWeek");
      }
    },
    [isMobile, currentView, changeView],
  );

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

  const updateCalendarTitle = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      const view = calendarApi.view;
      setCalendarTitle(view.title);
    }
  };

  const isMobileMonth = isMobile && currentView === "dayGridMonth";

  // For desktop month view: track the first event ID per day so we can render
  // it as a full block and all others as dots (replacing the "+X more" button)
  const firstEventIdPerDay = useMemo(() => {
    if (currentView !== "dayGridMonth" || isMobile) return new Map<string, string>();
    const map = new Map<string, string>();
    const sorted = [...events].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    sorted.forEach((session) => {
      const dayKey = new Date(session.startTime).toDateString();
      if (!map.has(dayKey)) map.set(dayKey, String(session.id));
    });
    return map;
  }, [events, currentView, isMobile]);

  return (
    <div className="h-full flex flex-col p-5">
      <style>{`
        @media (min-width: 768px) {
          .fc-dayGridMonth-view .fc-daygrid-day-events {
            justify-content: flex-start;
            align-items: flex-end;
            padding-bottom: 4px;
          }
        }
        @media (max-width: 767px) {
          .fc-daygrid-day {
            height: 56px !important;
            min-height: 56px !important;
          }
          .fc-dayGridMonth-view .fc-daygrid-day-frame {
            padding: 0.2rem !important;
          }
          .fc-daygrid-day-events .fc-event {
            min-height: 1rem !important;
          }
          .fc .fc-col-header-cell,
          .fc .fc-scrollgrid-section-header > td,
          .fc-scrollgrid-section-header th,
          .fc-scrollgrid-section-header td,
          .fc .fc-scrollgrid > thead,
          .fc .fc-scrollgrid > thead tr,
          .fc .fc-scrollgrid > thead th {
            background-color: var(--background) !important;
            border-color: var(--background) !important;
          }
          .fc .fc-timegrid-slot {
            height: 1.75rem !important;
          }
        }
      `}</style>
      <div className="flex-shrink-0">
        <CalendarControls
          calendarTitle={calendarTitle}
          setShowWeekends={setShowWeekends}
          goToPrev={goToPrev}
          goToNext={goToNext}
          goToToday={goToToday}
          isViewDropdownOpen={isViewDropdownOpen}
          setIsViewDropdownOpen={setIsViewDropdownOpen}
          currentView={currentView}
          changeView={changeView}
          showWeekends={showWeekends}
          tutors={transformedTutors}
          preferredTutorId={preferredTutorDbId ?? null}
          selectedTutorId={selectedTutorId}
          showBookedSessions={showBookedSessions}
          setBookedSessions={setShowBookedSessions}
          onTutorSelect={setSelectedTutorId}
        />
      </div>

      {/* FullCalendar Component */}
      <div ref={containerRef} className={`relative ${isMobileMonth ? "" : "flex-1 min-h-0 md:h-screen"}`}>
        {noSlotsOverlay && (
          <NoSlotsOverlay
            type={noSlotsOverlay.type}
            tutor={noSlotsOverlay.tutor}
          />
        )}
        <FullCalendar
          locale={locale === "en" ? "en-GB": locale}
          ref={calendarRef}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView={initialView}
          headerToolbar={false}
          height={isMobileMonth ? "auto" : "100%"}
          views={{
            timeGridWeek: {
              type: "timeGrid",
              duration: { weeks: 1 },
              buttonText: "Week",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "short" },
            },
            timeGrid2Day: {
              type: "timeGrid",
              duration: { days: 2 },
              buttonText: "2 days",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
            timeGrid3Day: {
              type: "timeGrid",
              duration: { days: 3 },
              buttonText: "3 days",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
            timeGridDay: {
              type: "timeGrid",
              duration: { days: 1 },
              buttonText: "Day",
              allDaySlot: false,
              dayHeaderFormat: { weekday: "long", day: "numeric" },
            },
          }}
          allDaySlot={false}
          events={events.map((session) => ({
            id: session.id,
            title: session.sessionType,
            start: session.startTime,
            end: session.endTime,
            extendedProps: {
              tutorId: session.tutorId,
              tutor: session.tutorName,
              duration: session.duration,
              sessionType: session.sessionType,
              location: session.location,
              status: session.status,
              description: session.description,
              videoCallUrl: session.videoCallUrl,
              // Regular session specific fields (only for regular sessions)
              isRecurring: (session as TutoringSession).isRecurring || false,
              invitationId: (session as TutoringSession).invitationId,
              studentId: (session as TutoringSession).studentId,
            },
          }))}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          editable={false}
          selectable={false}
          selectMirror={false}
          dayMaxEvents={currentView === "dayGridMonth" ? false : 1}
          weekNumbers={false}
          weekends={showWeekends}
          firstDay={1} // Monday
          eventContent={(eventInfo: EventContentArg) => {
            const status = eventInfo.event.extendedProps?.status;
            const sessionType = eventInfo.event.extendedProps?.sessionType;
            const isCancelled = status === "cancelled";
            const isPast = eventInfo.event.end ? new Date(eventInfo.event.end) < new Date() : false;

            const backgroundColor = isCancelled
              ? SESSION_COLORS.cancelled
              : getSessionColor(sessionType);
            const eventOpacity = isPast ? 0.7 : 0.9;

            if (currentView === "dayGridMonth") {
              const isFirstOfDay =
                !isMobile &&
                eventInfo.event.start &&
                firstEventIdPerDay.get(new Date(eventInfo.event.start).toDateString()) === eventInfo.event.id;

              if (!isFirstOfDay) {
                return (
                  <div className="flex items-center justify-center w-full h-full min-h-[6px]">
                    <div
                      className="rounded-full flex-shrink-0 shadow-sm"
                      style={{
                        width: isMobile ? "6px" : "12px",
                        height: isMobile ? "6px" : "12px",
                        borderRadius: isMobile ? "999px" : "3px",
                        backgroundColor,
                        opacity: eventOpacity,
                        border: "none",
                      }}
                    />
                  </div>
                );
              }
            }

            const startTime = new Date(eventInfo.event.start);
            const endTime = new Date(eventInfo.event.end);
            const timeString = `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")} - ${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

            return (
              <div
                className="text-white text-sm font-medium w-full"
                style={{
                  backgroundColor,
                  opacity: eventOpacity,
                  overflow: "hidden",
                  width: "100%",
                  height: "100%",
                  minHeight: "3.5rem",
                  borderRadius: "6px",
                  padding: "0px 8px",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div
                  className="truncate"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: "0px",
                    paddingLeft: "2px",
                    paddingRight: "8px",
                  }}
                >
                  {t(eventInfo.event.title)}
                </div>
                <div
                  className="text-xs opacity-80 truncate"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: "0px",
                    paddingBottom: "4px",
                    paddingRight: "8px",
                  }}
                >
                  {timeString}
                </div>
              </div>
            );
          }}
        />
      </div>

      {/* Event Details Sheet */}
      <EventSheet
        isEventSheetOpen={isEventSheetOpen}
        setIsEventSheetOpen={setIsEventSheetOpen}
        selectedSession={selectedEvent}
        tutorsData={transformedTutors}
        testSessionStatus={testSessionStatus}
      />
    </div>
  );
}
