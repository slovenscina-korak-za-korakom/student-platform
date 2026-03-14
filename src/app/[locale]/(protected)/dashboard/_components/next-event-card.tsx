"use client";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  IconCalendar,
  IconLoader2,
  IconUsers,
  IconUser,
  IconClock,
  IconMapPin,
} from "@tabler/icons-react";
import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import RescheduleDialog from "./reschedule-dialog";
import CancelRegularSessionDialog from "./cancel-regular-session-dialog";
import { useRouter } from "@/i18n/routing";
import { toast } from "sonner";
import { cancelBooking } from "@/actions/stripe-actions";
import { cancelSession } from "@/actions/timeblocks";
import {UnifiedEvent} from "@/types/interfaces";

interface NextEventCardProps {
  event: UnifiedEvent;
  locale: string;
}


const NextEventCard = ({ event, locale }: NextEventCardProps) => {
  const t = useTranslations("dashboard.events");
  const d = useTranslations("dashboard.cancel-booking-dialog");
  const tC = useTranslations("common.buttons");
  const tCancelRegular = useTranslations("dashboard.cancel-regular-session-dialog");
  const [isCancelling, setIsCancelling] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showCancelRegularDialog, setShowCancelRegularDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();

  // Update the current time every second for a smooth countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second for a smooth countdown

    return () => clearInterval(interval);
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      let response;
      if (event.type === "regulars") {
        toast.error("Regular sessions cannot be cancelled individually");
        setIsCancelling(false);
        return;
      } else if (event.type === "language-club" && event.bookingId) {
        response = await cancelBooking(event.bookingId);
      } else if (event.type === "personal" && typeof event.id === "number") {
        response = await cancelSession(event.id);
      } else {
        toast.error("Cannot cancel this event");
        setIsCancelling(false);
        return;
      }

      if (response?.status === 200) {
        router.refresh();
        toast.success(response.message || "Event cancelled successfully");
      } else {
        toast.error(response?.error || "Failed to cancel event");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast.error("Failed to cancel event");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReschedule = () => {
    setShowRescheduleDialog(true);
  };

  const isLanguageClub = event.type === "language-club";
  const isRegular = event.type === "regulars";
  const gradientColor = isLanguageClub
    ? "from-[var(--sl-purple)] to-[var(--sl-blue)]"
    : isRegular
      ? "from-[var(--sl-green)] to-[var(--sl-blue)]"
      : event.tutorColor
        ? `from-[${event.tutorColor}] to-[${event.tutorColor}]`
        : "from-[var(--sl-pink)] to-[var(--sl-purple)]";

  // Calculate time remaining with seconds always displayed
  const timeLeft = useMemo(() => {
    const now = currentTime;
    const eventTime = new Date(event.date);
    const diffMs = eventTime.getTime() - now.getTime();

    if (diffMs <= 0) {
      return "Event started";
    }

    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const seconds = diffSeconds % 60;
    const minutes = diffMinutes % 60;
    const hours = diffHours % 24;

    if (diffDays > 0) {
      return hours > 0
        ? `${diffDays}d ${hours}h ${minutes}m`
        : `${diffDays}d ${minutes}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${minutes}m`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}m ${seconds}s`;
    } else {
      return `${diffSeconds}s`;
    }
  }, [event.date, currentTime]);

  return (
    <>
      <Card className="w-full bg-white dark:bg-[#1a1a1a] rounded-2xl border border-border/40 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden">
          <CardHeader className="flex flex-row justify-between items-center gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`bg-gradient-to-br ${gradientColor} p-2.5 rounded-xl`}
                >
                  {isLanguageClub ? (
                    <IconUsers className="h-5 w-5 text-foreground" />
                  ) : (
                    <IconUser className="h-5 w-5 text-foregoround" />
                  )}
                </div>
                <CardTitle className="text-xl tracking-tight font-semibold text-foreground">
                  {t("next-event")}
                </CardTitle>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <p
                key={timeLeft}
                className="text-sm font-medium text-muted-foreground tabular-nums transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-2"
              >
                {timeLeft}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 pt-2">
            {/* Event Type Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={
                  isLanguageClub
                    ? "border-[var(--sl-purple)]/50 text-[var(--sl-purple)] bg-[var(--sl-purple)]/10"
                    : isRegular
                      ? "border-[var(--sl-green)]/50 text-[var(--sl-green)] bg-[var(--sl-green)]/10"
                      : "border-[var(--sl-pink)]/50 text-[var(--sl-pink)] bg-[var(--sl-pink)]/10"
                }
              >
                {isLanguageClub
                  ? t("language-club") || "Language Club"
                  : isRegular
                    ? t("regular-session") || "Regular Session"
                    : t("personal-session") || "Personal Session"}
              </Badge>
              {event.level && (
                <Badge variant="secondary" className="text-xs bg-muted/50">
                  {event.level}
                </Badge>
              )}
            </div>

            {/* Event Title */}
            <div>
              <h3 className="capitalize font-semibold text-xl text-foreground mb-2 tracking-tight">
                {isRegular ? t("regular-session") || "Regular Session" : event.theme}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("event-tutor", { tutor: event.tutor })}
              </p>
            </div>

            {/* Event Details */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconCalendar className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
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
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconClock className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                <span>{t("event-duration", { duration: event.duration })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <IconMapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                <span className="truncate">{event.location}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-row gap-3 pt-6 border-t border-border/30">
            {isRegular ? (
              (() => {
                const hoursUntilSession = (new Date(event.date).getTime() - currentTime.getTime()) / (1000 * 60 * 60);
                const canCancel = hoursUntilSession > 24;
                return (
                  <div className="flex flex-col w-full gap-2">
                    <div className="flex-1 text-center text-xs text-muted-foreground/70">
                      {t("recurring-note") || "Weekly recurring session"}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full border-red-500/40 text-red-500 hover:text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-400/10 transition-all duration-200 h-11 disabled:opacity-50"
                      disabled={!canCancel || isCancelling}
                      onClick={() => setShowCancelRegularDialog(true)}
                    >
                      {isCancelling ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tC("cancelling")}
                        </>
                      ) : (
                        tC("cancel-booking")
                      )}
                    </Button>
                    {!canCancel && (
                      <p className="text-xs text-muted-foreground/60 text-center">
                        {tCancelRegular("unable-to-cancel")}
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              <>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-500/40 text-red-500 hover:text-red-700 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-400/10 transition-all duration-200 h-11"
                      disabled={isCancelling}
                    >
                      {isCancelling ? (
                        <>
                          <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                          {tC("cancelling")}
                        </>
                      ) : (
                        tC("cancel-booking")
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-white dark:bg-[#1a1a1a] border-red-500 dark:border-red-500/30 border-2 rounded-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{d("title")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {d("description")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{tC("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() =>
                          toast.promise(handleCancel, {
                            loading: tC("cancelling"),
                          })
                        }
                        disabled={isCancelling}
                        className={buttonVariants({ variant: "destructive" })}
                      >
                        {isCancelling ? (
                          <>
                            <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                            {tC("cancelling")}
                          </>
                        ) : (
                          tC("cancel-booking")
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {isLanguageClub && event.bookingId && (
                  <Button
                    onClick={handleReschedule}
                    variant="outline"
                    className="flex-1 border-[var(--sl-purple)]/40 text-[var(--sl-purple)] bg-[var(--sl-purple)]/10 hover:bg-[var(--sl-purple)]/20 transition-all duration-200 h-11 font-medium"
                  >
                    {tC("reschedule")}
                  </Button>
                )}
              </>
            )}
          </CardFooter>
        </Card>

      {isLanguageClub && event.bookingId && typeof event.id === "number" && (
        <RescheduleDialog
          open={showRescheduleDialog}
          onOpenChange={setShowRescheduleDialog}
          currentEvent={{
            id: event.id,
            theme: event.theme,
            date: event.date,
            tutor: event.tutor,
            location: event.location,
            duration: event.duration,
            maxBooked: 10, // Will be fetched by RescheduleDialog
            peopleBooked: 0, // Will be fetched by RescheduleDialog
            level: event.level || "",
            price: 0, // Will be fetched by RescheduleDialog
          }}
          bookingId={event.bookingId}
          locale={locale}
        />
      )}

      {isRegular && event.invitationId && (
        <CancelRegularSessionDialog
          open={showCancelRegularDialog}
          onOpenChange={setShowCancelRegularDialog}
          invitationId={event.invitationId}
          sessionDate={new Date(event.date)}
          tutorName={event.tutor}
          locale={locale}
        />
      )}
    </>
  );
};

export default NextEventCard;
