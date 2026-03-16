"use client";
import React, { useMemo, useState } from "react";
import NextEventCard from "./next-event-card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  IconUsers,
  IconUser,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconTrash,
  IconCalendarSearch,
  IconLoader2,
  IconX,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { cancelBooking } from "@/actions/stripe-actions";
import { cancelSession } from "@/actions/timeblocks";
import RescheduleDialog from "./reschedule-dialog";
import CancelRegularSessionDialog from "./cancel-regular-session-dialog";
import {LangClubEvent, PersonalSession, RegularSession, UnifiedEvent} from "@/types/interfaces";
import { SESSION_COLORS, getSessionColor, hexToRgba } from "@/lib/session-colors";


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
          <ViewAllScheduledDialog events={allEvents} locale={locale} />
        )}

        <Separator />
      </div>
    </div>
  );
};

export default DashboardClient;

function ViewAllScheduledDialog({
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
  const [cancelRegularEvent, setCancelRegularEvent] = useState<{
    invitationId: number;
    sessionDate: Date;
    tutorName: string;
  } | null>(null);
  const t = useTranslations("dashboard.all-scheduled-events");
  const tE = useTranslations("dashboard.events");
  const tButtons = useTranslations("common.buttons");
  const tCancel = useTranslations("dashboard.cancel-booking-dialog");
  const router = useRouter();

  // Sort events by date
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  const handleCancel = async (event: UnifiedEvent) => {
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

  const handleReschedule = (event: UnifiedEvent) => {
    if (event.type === "language-club" && event.bookingId) {
      setRescheduleEvent({
        id: event.id,
        type: "language-club",
        bookingId: event.bookingId,
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="link" className="p-0 m-0 cursor-pointer">
            {t("link")}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[440px] p-0 overflow-hidden bg-white dark:bg-[#1e1e1e] shadow-[-4px_0_24px_rgba(0,0,0,0.15)]"
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <SheetHeader className="relative px-8 pt-8 pb-6 border-b border-border/10">
              <SheetClose className="absolute right-6 top-6 rounded-full opacity-70 ring-offset-background transition-all hover:opacity-100 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-muted p-2">
                <IconX className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </SheetClose>

              <div className="pr-10">
                <SheetTitle className="text-[28px] font-semibold text-foreground leading-tight tracking-tight">
                  {t("event-view-card.title") || "All Scheduled Events"}
                </SheetTitle>
                <SheetDescription className="text-[14px] text-muted-foreground mt-3 leading-relaxed">
                  {t("event-view-card.description") ||
                    "View and manage all your upcoming events"}
                </SheetDescription>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-gray-50/30 dark:bg-[#1a1a1a]/30 smooth-scroll">
              {sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-20">
                  <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mb-5">
                    <IconCalendar className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    No events scheduled yet
                  </h3>
                  <p className="text-sm text-muted-foreground text-center max-w-[280px] leading-relaxed">
                    Your scheduled events will appear here
                  </p>
                </div>
              ) : (
                <div className="px-6 py-6 space-y-6">
                  {/* Events List */}
                  <div className="space-y-4 pt-2">
                    <div className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-[0.5px] px-1">
                      {t("message", {count: sortedEvents.length})}
                    </div>
                    {sortedEvents.map((event) => {
                      const isLanguageClub = event.type === "language-club";
                      const isRegular = event.type === "regular";
                      const eventColor = isLanguageClub
                        ? SESSION_COLORS["language-club"]
                        : getSessionColor(event.sessionType || event.theme);
                      const iconContainerStyle = {background: `linear-gradient(to bottom right, ${eventColor}, ${hexToRgba(eventColor, 0.7)})`};

                      return (
                        <div
                          key={`${event.type}-${event.id}`}
                          className="group relative bg-white dark:bg-[#252525] rounded-xl border border-border/10 dark:border-white/5 p-5 shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                              style={iconContainerStyle}
                            >
                              {isLanguageClub ? (
                                <IconUsers className="h-5 w-5 text-white" />
                              ) : (
                                <IconUser className="h-5 w-5 text-white" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-3">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2.5 flex-wrap">
                                  <h4 className="font-semibold text-[15px] text-foreground leading-tight">
                                    {isRegular ? tE("regular-session"): event.theme}
                                  </h4>
                                  <Badge
                                    variant="outline"
                                    className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                    style={{
                                      borderColor: hexToRgba(eventColor, 0.4),
                                      color: eventColor,
                                      backgroundColor: hexToRgba(eventColor, 0.08),
                                    }}
                                  >
                                    {isLanguageClub
                                      ? tE("language-club") || "Language Club"
                                      : isRegular
                                      ? tE("regular-session") || "Regular Session"
                                      : tE("personal-session") || "Personal Session"}
                                  </Badge>
                                </div>
                                <p className="text-[13px] text-muted-foreground/80">
                                  {tE("event-tutor", { tutor: event.tutor })}
                                </p>
                              </div>

                              <div className="space-y-2 text-[13px]">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <IconCalendar className="h-4 w-4 flex-shrink-0 opacity-60" />
                                  <span>
                                    {new Date(event.date).toLocaleDateString(locale, {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <IconClock className="h-4 w-4 flex-shrink-0 opacity-60" />
                                  <span>
                                    {tE("event-duration", {
                                      duration: event.duration,
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <IconMapPin className="h-4 w-4 flex-shrink-0 opacity-60" />
                                  <span className="truncate">
                                    {event.location}
                                  </span>
                                </div>
                                {isLanguageClub && event.level && (
                                  <Badge
                                    variant="secondary"
                                    className="w-fit mt-1 text-[11px] px-2.5 py-0.5"
                                  >
                                    {event.level}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 flex-shrink-0">
                              {isRegular ? (
                                (() => {
                                  const hoursUntilSession = (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                                  const canCancel = hoursUntilSession > 24;
                                  return (
                                    <div className="flex flex-col items-end gap-1.5">
                                      <div className="text-[11px] text-muted-foreground/70 text-right max-w-[80px]">
                                        {tE("recurring-note") || "Weekly recurring"}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!canCancel || isCancelling === event.id}
                                        title={!canCancel ? "Cannot cancel sessions within 24 hours" : "Cancel this session"}
                                        onClick={() => {
                                          if (event.invitationId) {
                                            setCancelRegularEvent({
                                              invitationId: event.invitationId,
                                              sessionDate: event.date,
                                              tutorName: event.tutor,
                                            });
                                          }
                                        }}
                                      >
                                        {isCancelling === event.id ? (
                                          <IconLoader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <IconTrash className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  );
                                })()
                              ) : (
                                <>
                                  {isLanguageClub && event.bookingId && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 rounded-lg border-border/50 hover:bg-muted/50 hover:border-border transition-all"
                                      disabled={isCancelling === event.id}
                                      onClick={() => handleReschedule(event)}
                                    >
                                      <IconCalendarSearch className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-700 dark:hover:text-red-300 transition-all"
                                        disabled={isCancelling === event.id}
                                      >
                                        {isCancelling === event.id ? (
                                          <IconLoader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <IconTrash className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white dark:bg-[#1e1e1e] border-red-500 dark:border-red-500/30 border-2 rounded-2xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>
                                          {tCancel("title")}
                                        </AlertDialogTitle>
                                        <AlertDialogDescription>
                                          {tCancel("description")}
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>
                                          {tButtons("cancel")}
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            toast.promise(handleCancel(event), {
                                              loading: tButtons("cancelling"),
                                            })
                                          }
                                          disabled={isCancelling === event.id}
                                          className={buttonVariants({
                                            variant: "destructive",
                                          })}
                                        >
                                          {isCancelling === event.id ? (
                                            <>
                                              <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                                              {tButtons("cancelling")}
                                            </>
                                          ) : (
                                            tButtons("cancel-booking")
                                          )}
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Reschedule Dialog */}
      {rescheduleEvent &&
        rescheduleEvent.type === "language-club" &&
        rescheduleEvent.bookingId &&
        (() => {
          const event = sortedEvents.find(
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
                if (!open) {
                  setRescheduleEvent(null);
                }
              }}
              currentEvent={currentEvent}
              bookingId={rescheduleEvent.bookingId}
              locale={locale}
            />
          );
        })()}

      {/* Cancel Regular Session Dialog */}
      {cancelRegularEvent && (
        <CancelRegularSessionDialog
          open={!!cancelRegularEvent}
          onOpenChange={(open) => {
            if (!open) {
              setCancelRegularEvent(null);
            }
          }}
          invitationId={cancelRegularEvent.invitationId}
          sessionDate={cancelRegularEvent.sessionDate}
          tutorName={cancelRegularEvent.tutorName}
          locale={locale}
        />
      )}
    </>
  );
}
