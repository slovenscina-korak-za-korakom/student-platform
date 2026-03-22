"use client";

import React from "react";
import {Sheet, SheetContent, SheetDescription, SheetTitle} from "@/components/ui/sheet";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  IconUsers,
  IconUser,
  IconTrash,
  IconCalendarSearch,
  IconLoader2,
  IconMapPin,
  IconClock,
  IconCalendar,
  IconX,
  IconRepeat,
} from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SESSION_COLORS, getSessionColor, hexToRgba } from "@/lib/session-colors";
import CancelRegularSessionDialog from "./cancel-regular-session-dialog";

export type DayEventItem = {
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
};

interface DayEventsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | undefined;
  events: DayEventItem[];
  locale: string;
  isCancelling: number | string | null;
  onCancel: (event: DayEventItem) => Promise<void>;
  onReschedule: (event: DayEventItem) => void;
  /** Override the header eyebrow text (defaults to weekday name) */
  headerTitle?: string;
  /** Override the main header heading (defaults to full date) */
  headerHeading?: string;
  /** Override the count chip text */
  headerChip?: string;
  /** Show full date+time in cards instead of time-only */
  showFullDate?: boolean;
}

// ── Event card ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: DayEventItem;
  locale: string;
  isCancelling: number | string | null;
  onCancel: (event: DayEventItem) => Promise<void>;
  onReschedule: (event: DayEventItem) => void;
  t: ReturnType<typeof useTranslations>;
  tButtons: ReturnType<typeof useTranslations>;
  tCancel: ReturnType<typeof useTranslations>;
  onOpenCancelRegular: (invitationId: number, sessionDate: Date, tutorName: string) => void;
  showFullDate?: boolean;
}

function EventCard({
  event,
  locale,
  isCancelling,
  onCancel,
  onReschedule,
  t,
  tButtons,
  tCancel,
  showFullDate,
  onOpenCancelRegular,
}: EventCardProps) {
  const isLanguageClub = event.type === "language-club";
  const isRegular = event.type === "regular";

  const eventColor = isLanguageClub
    ? SESSION_COLORS["language-club"]
    : getSessionColor(event.theme);

  const isPast =
    new Date(event.date.getTime() + (event.duration ?? 45) * 60000) < new Date();

  const hoursUntilSession =
    (event.date.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  const canCancel = hoursUntilSession > 24;

  const activeColor = isPast ? hexToRgba(eventColor, 0.5) : eventColor;

  const titleMap: Record<string, string> = {
    individual: t("individual"),
    group: t("group"),
    test: t("test-session"),
    regular: t("regular-session"),
  };
  const title = isLanguageClub
    ? (event.theme ?? "")
    : (titleMap[event.theme ?? ""] ?? event.theme ?? "");

  const timeStr = showFullDate
    ? event.date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : event.date.toLocaleTimeString(locale, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      });

  return (
    <div className="relative bg-white dark:bg-[#252525] rounded-2xl border border-border/10 dark:border-white/5 overflow-hidden shadow-sm">
      {/* Left colour stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: activeColor }}
      />

      <div className="pl-5 pr-4 pt-4 pb-3">
        {/* Icon + title row */}
        <div className="flex items-start gap-3 mb-3.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-0.5"
            style={{
              background: `linear-gradient(135deg, ${eventColor}, ${hexToRgba(eventColor, 0.65)})`,
              opacity: isPast ? 0.65 : 1,
            }}
          >
            {isLanguageClub ? (
              <IconUsers className="h-[18px] w-[18px] text-white" />
            ) : (
              <IconUser className="h-[18px] w-[18px] text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-semibold text-foreground leading-tight capitalize">
                {title}
              </h4>
            </div>
            <p className="text-[12px] text-muted-foreground">
              {t("event-tutor", { tutor: event.tutor })}
            </p>
          </div>
        </div>

        {/* Detail rows */}
        <div className="space-y-1.5 text-[12px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <IconClock className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span>
              {timeStr}
              <span className="mx-1.5 opacity-30">·</span>
              {t("event-duration", { duration: event.duration })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <IconMapPin className="h-3.5 w-3.5 shrink-0 opacity-50" />
            <span className="truncate">{event.location}</span>
          </div>

          {isRegular && (
            <div className="flex items-center gap-2 opacity-70">
              <IconRepeat className="h-3.5 w-3.5 shrink-0" />
              <span>{t("recurring-note")}</span>
            </div>
          )}

          {isLanguageClub && event.level && (
            <span
              className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-md mt-0.5"
              style={{
                backgroundColor: hexToRgba(eventColor, 0.08),
                color: eventColor,
              }}
            >
              {event.level}
            </span>
          )}
        </div>
      </div>

      {/* Actions footer */}
      {!isPast && (
        <div className="border-t border-border/10 dark:border-white/5 px-4 py-2.5 flex items-center justify-end gap-1.5 bg-muted/10 dark:bg-white/[0.02]">
          {isRegular ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px] gap-1.5 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/8"
              disabled={!canCancel || isCancelling === event.id}
              title={
                !canCancel
                  ? "Cannot cancel within 24 hours"
                  : "Cancel this session"
              }
              onClick={() => {
                if (event.invitationId) {
                  onOpenCancelRegular(
                    event.invitationId,
                    event.date,
                    event.tutor ?? "",
                  );
                }
              }}
            >
              {isCancelling === event.id ? (
                <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <IconTrash className="h-3.5 w-3.5" />
              )}
              {tButtons("cancel")}
            </Button>
          ) : (
            <>
              {isLanguageClub && event.bookingId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px] gap-1.5 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  disabled={isCancelling === event.id}
                  onClick={() => onReschedule(event)}
                >
                  <IconCalendarSearch className="h-3.5 w-3.5" />
                  {tButtons("reschedule")}
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[12px] gap-1.5 px-2.5 text-destructive hover:text-destructive hover:bg-destructive/8"
                    disabled={isCancelling === event.id}
                  >
                    {isCancelling === event.id ? (
                      <IconLoader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <IconTrash className="h-3.5 w-3.5" />
                    )}
                    {tButtons("cancel")}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-white dark:bg-[#1e1e1e] border-2 border-red-500 dark:border-red-500/30 rounded-2xl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>{tCancel("title")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {tCancel("description")}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tButtons("cancel")}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() =>
                        toast.promise(onCancel(event), {
                          loading: tButtons("cancelling"),
                        })
                      }
                      disabled={isCancelling === event.id}
                      className={buttonVariants({ variant: "destructive" })}
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
      )}
    </div>
  );
}

// ── Main sheet ────────────────────────────────────────────────────────────────

export function DayEventsSheet({
  open,
  onOpenChange,
  selectedDate,
  events,
  locale,
  isCancelling,
  onCancel,
  onReschedule,
  headerTitle,
  headerHeading,
  headerChip,
  showFullDate,
}: DayEventsSheetProps) {
  const t = useTranslations("dashboard.events");
  const tButtons = useTranslations("common.buttons");
  const tCancel = useTranslations("dashboard.cancel-booking-dialog");

  const [cancelRegularEvent, setCancelRegularEvent] = React.useState<{
    invitationId: number;
    sessionDate: Date;
    tutorName: string;
  } | null>(null);

  const date = selectedDate ?? new Date();

  const dayName = date.toLocaleDateString(locale, { weekday: "long" });
  const fullDate = date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-[420px] p-0 flex flex-col overflow-hidden bg-background dark:bg-[#1a1a1a]"
        >
          <SheetTitle className="sr-only">{headerHeading ?? fullDate}</SheetTitle>
          <SheetDescription className="sr-only">{`${headerHeading} - ${date.toLocaleDateString(locale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}`}</SheetDescription>

          {/* ── Gradient header ── */}
          <div
            className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(150deg, #2563eb 0%, #7c3aed 60%, #6d28d9 100%)",
            }}
          >
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

            <div className="relative">
              {/* Top row: icon + close */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                  style={{ background: "rgba(255,255,255,0.18)" }}
                >
                  <IconCalendar className="h-6 w-6 text-white" />
                </div>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close"
                >
                  <IconX className="h-4 w-4" />
                </button>
              </div>

              {/* Eyebrow + heading */}
              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-0.5">
                {headerTitle ?? dayName}
              </p>
              <h2 className="text-white text-2xl font-bold leading-tight mb-3">
                {headerHeading ?? fullDate}
              </h2>

              {/* Chip */}
              <span
                className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}
              >
                {headerChip ?? (events.length > 0
                  ? t("events-scheduled", { events: events.length })
                  : t("no-events", {
                      date: date.toLocaleDateString(locale, {
                        month: "long",
                        day: "numeric",
                      }),
                    }))}
              </span>
            </div>
          </div>

          {/* ── Scrollable body ── */}
          <div className="flex-1 overflow-y-auto">
            {events.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-8 py-20">
                <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mb-4">
                  <IconCalendar className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="text-sm text-muted-foreground text-center max-w-[220px] leading-relaxed">
                  {t("calendar-description")}
                </p>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-3">
                {/* Section label */}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="w-[3px] h-3.5 rounded-full bg-gradient-to-b from-blue-500 to-violet-600 shrink-0" />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {t("events")}
                  </p>
                </div>

                {events.map((event) => (
                  <EventCard
                    key={`${event.type}-${event.id}`}
                    event={event}
                    locale={locale}
                    isCancelling={isCancelling}
                    onCancel={onCancel}
                    onReschedule={onReschedule}
                    showFullDate={showFullDate}
                    t={t}
                    tButtons={tButtons}
                    tCancel={tCancel}
                    onOpenCancelRegular={(invitationId, sessionDate, tutorName) =>
                      setCancelRegularEvent({ invitationId, sessionDate, tutorName })
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Cancel Regular Session Dialog (rendered outside sheet to avoid z-index issues) */}
      {cancelRegularEvent && (
        <CancelRegularSessionDialog
          open={!!cancelRegularEvent}
          onOpenChange={(open) => {
            if (!open) setCancelRegularEvent(null);
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

export default DayEventsSheet;
