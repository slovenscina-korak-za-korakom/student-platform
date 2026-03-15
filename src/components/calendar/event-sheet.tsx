import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tutor, TutoringSession } from "./types";
import {
  IconCalendar,
  IconMapPin,
  IconPhone,
  IconMail,
  IconCalendarEvent,
  IconX,
  IconClock,
  IconRepeat,
} from "@tabler/icons-react";
import {bookSession, bookTestSession} from "@/actions/timeblocks";
import {toast} from "sonner";
import {useRouter} from "@/i18n/routing";
import {useLocale, useTranslations} from "next-intl";
import CancelRegularSessionDialog from "@/app/[locale]/(protected)/dashboard/_components/cancel-regular-session-dialog";

type EventSheetProps = {
  isEventSheetOpen: boolean;
  setIsEventSheetOpen: (isEventSheetOpen: boolean) => void;
  selectedSession: TutoringSession | null;
  tutorsData: Tutor[];
  testSessionStatus?: string | null;
};

export const EventSheet = (props: EventSheetProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("calendar.sheet")
  const t2 = useTranslations("calendar.event-place")
  const t3 = useTranslations("common.buttons")
  const tE = useTranslations("dashboard.events")
  const tCancel = useTranslations("dashboard.cancel-regular-session-dialog")
  const isTestSession = props.selectedSession?.sessionType === "test";

  // TODO: add canceling functionality to event sheet
  const cancelMessage = {
    sl: "Prosimo prekličite dokodke preko dashboarda",
    en: "Please cancel sessions through the dashboard",
    it: "Si prega di annullare le sessioni tramite la dashboard",
    ru: "Пожалуйста, отменяйте занятия через личный кабинет"
  }

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: locale === "en",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const tutor = props.tutorsData.find(
    (t) => t.id === props.selectedSession?.tutorId
  );

  const onBookSesson = async (session: TutoringSession) =>{
    if (isBooking) return; // Prevent double-clicks

    setIsBooking(true);
    try {
      const response = session.sessionType === "test"
        ? await bookTestSession(session)
        : await bookSession(session);
      if (response.status === 200) {
        router.refresh();
        toast.success(response.message);
        props.setIsEventSheetOpen(false);
      } else {
        toast.error(response.message);
      }
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <Sheet
      open={props.isEventSheetOpen}
      onOpenChange={props.setIsEventSheetOpen}
    >
      <SheetContent className="w-[400px] sm:w-[540px] p-0 overflow-hidden">
        {props.selectedSession && (
          <div className="flex flex-col h-full">
            {/* Title for accessibility */}
            <SheetTitle className="sr-only">
              {props.selectedSession.sessionType} with{" "}
              {props.selectedSession.tutorName}
            </SheetTitle>

            {/* Header Section with Gradient */}
            <div className="relative p-6 pb-4 overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.08] gradient-primary pointer-events-none" />

              <div className="relative z-10 flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {isTestSession ? t("test-session-title") : t("title")}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("subtitle", {name: props.selectedSession.tutorName})}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isTestSession && (
                    <Badge className="bg-amber-500 text-white shadow-sm text-xs px-2 py-0.5">
                      FREE
                    </Badge>
                  )}
                  <Badge
                    variant={props.selectedSession.status as "booked" | "available" | "cancelled"}
                    className="shadow-sm"
                  >
                    <span className="capitalize">
                      {t(`status.${props.selectedSession.status}`)}
                    </span>
                  </Badge>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Content Section */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {/* Session Overview */}
              <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("session")}
                </h3>
                <div className="bg-muted/50 hover:bg-muted/70 border border-border rounded-lg p-4 space-y-3 transition-all duration-200">
                  <p className="text-sm text-foreground/90">
                    {isTestSession ? t("test-session-description") : t("session-status")}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="p-1.5 bg-accent rounded-md">
                        <IconClock className="h-3.5 w-3.5 text-accent-foreground" />
                      </div>
                      <span className="text-foreground/80 font-medium">
                        {t("session-duration", {time: props.selectedSession.duration})}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-75">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("when")}
                </h3>
                <div className="group bg-muted/50 hover:bg-muted/70 border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-sl-blue/10 to-sl-purple/10 dark:from-sl-blue/20 dark:to-sl-purple/20 rounded-lg border border-sl-blue/20 transition-transform group-hover:scale-105">
                      <IconCalendar className="h-4 w-4 text-sl-blue dark:text-sl-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(new Date(props.selectedSession.startTime))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                        {formatTime(new Date(props.selectedSession.startTime))}{" "}
                        - {formatTime(new Date(props.selectedSession.endTime))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tutor Information */}
              <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-150">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Tutor
                </h3>
                <div className="bg-muted/50 border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                    <Avatar className="h-11 w-11 ring-2 ring-border shadow-sm">
                      <AvatarImage src={tutor?.avatar} alt={tutor?.name} />
                      <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-sl-purple/20 to-sl-pink/20 text-foreground">
                        {getInitials(props.selectedSession.tutorName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {props.selectedSession.tutorName}
                      </p>
                      {tutor?.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tutor.bio}</p>
                      )}
                    </div>
                  </div>

                  {tutor?.email && (
                    <div className="flex items-center gap-3 group/item hover:bg-accent/30 rounded-md p-2 -mx-2 transition-colors">
                      <div className="p-2 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-400/20 dark:to-emerald-500/20 rounded-md border border-emerald-500/20">
                        <IconMail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          Email
                        </p>
                        <p className="text-sm text-foreground truncate">{tutor.email}</p>
                      </div>
                    </div>
                  )}

                  {tutor?.phone && (
                    <div className="flex items-center gap-3 group/item hover:bg-accent/30 rounded-md p-2 -mx-2 transition-colors">
                      <div className="p-2 bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-400/20 dark:to-blue-500/20 rounded-md border border-blue-500/20">
                        <IconPhone className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("phone")}
                        </p>
                        <p className="text-sm text-foreground truncate">{tutor.phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Details */}
              <div className="space-y-3 animate-in fade-in-50 slide-in-from-bottom-2 duration-300 delay-200">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {t("session-details")}
                </h3>
                <div className="group bg-muted/50 hover:bg-muted/70 border border-border rounded-lg p-4 transition-all duration-200 hover:shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-purple-500/10 to-purple-600/10 dark:from-purple-400/20 dark:to-purple-500/20 rounded-lg border border-purple-500/20 transition-transform group-hover:scale-105">
                      <IconMapPin className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t("location")}
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">
                        {t2(props.selectedSession.location)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="opacity-50" />

            {/* Action Buttons */}
            <div className="p-6 bg-muted/20">
              <div className="flex flex-col gap-3">
                {props.selectedSession.status === "available" ? (
                  <Button
                    className="flex-1 shadow-sm hover:shadow-md transition-all duration-200 min-h-10 rounded-full"
                    onClick={() => onBookSesson(props.selectedSession)}
                    disabled={isBooking}
                  >
                    {isBooking ? (
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <IconCalendarEvent className="h-4 w-4 mr-2" />
                    )}
                    {isBooking
                      ? t("buttons.booking") || "Booking..."
                      : isTestSession
                      ? t("buttons.book-test")
                      : t("buttons.book")}
                  </Button>
                ) : props.selectedSession.status === "regular" ? (
                  // Regular session actions
                  (() => {
                    const hoursUntilSession = (new Date(props.selectedSession.startTime).getTime() - new Date().getTime()) / (1000 * 60 * 60);
                    const canCancel = hoursUntilSession > 24;
                    return (
                      <>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <IconRepeat className="h-4 w-4" />
                          <span>{tE("recurring-note")}</span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            className="flex-1 shadow-sm hover:shadow transition-all duration-200"
                            disabled={!canCancel}
                            onClick={() => setCancelDialogOpen(true)}
                          >
                            <IconX className="h-4 w-4 mr-2" />
                            {t3("cancel")}
                          </Button>
                        </div>
                        {!canCancel && (
                          <p className="text-xs text-muted-foreground text-center">
                            {tCancel("unable-to-cancel") || "Cannot cancel sessions within 24 hours"}
                          </p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  // Booked personal session actions
                  <div className="flex gap-3">
                    <Button
                      disabled
                      variant="destructive"
                      className="flex-1 shadow-sm hover:shadow transition-all duration-200 rounded-full text-xs"
                    >
                      {/*<IconX className="h-4 w-4 mr-2" />*/}
                      {/*{t3("cancel")}*/}
                      {cancelMessage[locale]}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Regular Session Dialog */}
        {props.selectedSession?.status === "regular" && props.selectedSession.invitationId && (
          <CancelRegularSessionDialog
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
            invitationId={props.selectedSession.invitationId}
            sessionDate={new Date(props.selectedSession.startTime)}
            tutorName={props.selectedSession.tutorName}
            locale={locale}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};
