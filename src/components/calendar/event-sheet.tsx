import React, { useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tutor, TutoringSession } from "./types";
import {
  IconCalendar,
  IconPhone,
  IconMail,
  IconCalendarEvent,
  IconX,
  IconClock,
  IconRepeat,
  IconVideo,
  IconBuilding,
} from "@tabler/icons-react";
import Image from "next/image";
import { bookSession, bookTestSession, cancelSession } from "@/actions/timeblocks";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import CancelRegularSessionDialog from "@/app/[locale]/(protected)/dashboard/_components/cancel-regular-session-dialog";
import {Button} from "@/components/ui/button";

type EventSheetProps = {
  isEventSheetOpen: boolean;
  setIsEventSheetOpen: (isEventSheetOpen: boolean) => void;
  selectedSession: TutoringSession | null;
  tutorsData: Tutor[];
  testSessionStatus?: string | null;
};

const SESSION_TYPE_CONFIG: Record<string, { label: string; hex: string; lightColor: string; borderColor: string }> = {
  individual: { label: "Individual", hex: "#3b82f6", lightColor: "rgba(59,130,246,0.08)",  borderColor: "rgba(59,130,246,0.22)" },
  group:       { label: "Group",      hex: "#8b5cf6", lightColor: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.22)" },
  regular:     { label: "Regular",    hex: "#ec4899", lightColor: "rgba(236,72,153,0.08)", borderColor: "rgba(236,72,153,0.22)" },
  test:        { label: "Test",       hex: "#f97316", lightColor: "rgba(249,115,22,0.08)", borderColor: "rgba(249,115,22,0.22)" },
};

const fmtDuration = (min: number) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const EventSheet = (props: EventSheetProps) => {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("calendar.sheet");
  const t2 = useTranslations("calendar.event-place");
  const t3 = useTranslations("common.buttons");
  const tE = useTranslations("dashboard.events");
  const tCancel = useTranslations("dashboard.cancel-regular-session-dialog");
  const tCancelDialog = useTranslations("dashboard.cancel-booking-dialog");

  const isTestSession = props.selectedSession?.sessionType === "test";

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelBookedDialogOpen, setCancelBookedDialogOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
      hour12: locale === "en",
    });

  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const tutor = props.tutorsData.find((t) => t.id === props.selectedSession?.tutorId);
  const session = props.selectedSession;

  const sessionCfg =
    SESSION_TYPE_CONFIG[session?.sessionType ?? "individual"] ?? SESSION_TYPE_CONFIG.individual;

  const onBookSession = async (s: TutoringSession) => {
    if (isBooking) return;
    setIsBooking(true);
    try {
      const response = s.sessionType === "test" ? await bookTestSession(s) : await bookSession(s);
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
  };

  const hoursUntilSession = session
    ? (new Date(session.startTime).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;
  const canCancel = hoursUntilSession > 24;

  const onCancelBookedSession = async () => {
    if (!session || isCancelling) return;
    setIsCancelling(true);
    try {
      const response = await cancelSession(parseInt(session.id));
      if (response.status === 200) {
        setCancelBookedDialogOpen(false);
        router.refresh();
        toast.success(response.message);
        props.setIsEventSheetOpen(false);
      } else {
        setCancelBookedDialogOpen(false);
        toast.error("message" in response ? response.message : response.error);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  const showFooter = session && (
    session.status === "available" ||
    session.status === "regular" ||
    session.status === "booked"
  );

  return (
    <>
      <Sheet open={props.isEventSheetOpen} onOpenChange={props.setIsEventSheetOpen}>
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col overflow-hidden gap-0">
          <SheetTitle className="sr-only">
            {session?.sessionType} with {session?.tutorName}
          </SheetTitle>

          {session && (
            <>
              {/* ── Gradient header ── */}
              <div
                className="shrink-0 px-6 pt-7 pb-6 relative overflow-hidden"
                style={{ background: "linear-gradient(150deg, #2563eb 0%, #7c3aed 60%, #6d28d9 100%)" }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-6 -left-4 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    {/* Tutor avatar */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg overflow-hidden shrink-0"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    >
                      {tutor?.avatar
                        ? <Image height={56} width={56} src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
                        : getInitials(session.tutorName)}
                    </div>
                    <button
                      onClick={() => props.setIsEventSheetOpen(false)}
                      className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <IconX className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-white/50 text-[11px] font-semibold uppercase tracking-widest mb-1">
                    {isTestSession ? t("test-session-title") : t("title")}
                  </p>
                  <h2 className="text-white text-xl font-bold leading-tight mb-3">
                    {session.tutorName}
                  </h2>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(255,255,255,0.18)", color: "#fff" }}
                    >
                      {sessionCfg.label}
                    </span>
                    {isTestSession && (
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ backgroundColor: "rgba(251,191,36,0.25)", color: "#fbbf24" }}
                      >
                        FREE
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
                    >
                      {t(`status.${session.status}`)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Scrollable body ── */}
              <div className="flex-1 overflow-y-auto">

                {/* When */}
                <div className="px-5 py-4 border-b border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("when")}
                  </p>
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                    >
                      <IconCalendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {formatDate(new Date(session.startTime))}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <IconClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-muted-foreground tabular-nums">
                          {formatTime(new Date(session.startTime))} – {formatTime(new Date(session.endTime))}
                        </span>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-sm text-muted-foreground">{fmtDuration(session.duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="px-5 py-4 border-b border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("location")}
                  </p>
                  <div className="flex items-center gap-2.5">
                    {session.location === "online"
                      ? <IconVideo className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <IconBuilding className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-sm font-medium text-foreground">
                      {t2(session.location)}
                    </span>
                  </div>
                </div>

                {/* Tutor */}
                <div className="px-5 py-4 border-b border-border/60">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Tutor
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                      style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
                    >
                      {tutor?.avatar
                        ? <Image height={36} width={36} src={tutor.avatar} alt={tutor.name} className="w-full h-full object-cover" />
                        : getInitials(session.tutorName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground">{session.tutorName}</span>
                      {tutor?.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tutor.bio}</p>
                      )}
                    </div>
                  </div>
                  {tutor?.email && (
                    <div className="flex items-center gap-2.5 mt-2">
                      <IconMail className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground truncate">{tutor.email}</span>
                    </div>
                  )}
                  {tutor?.phone && (
                    <div className="flex items-center gap-2.5 mt-2">
                      <IconPhone className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm text-muted-foreground">{tutor.phone}</span>
                    </div>
                  )}
                </div>

                {/* Session */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    {t("session")}
                  </p>
                  <div
                    className="px-4 py-3 rounded-xl space-y-2"
                    style={{ backgroundColor: sessionCfg.lightColor, border: `1.5px solid ${sessionCfg.borderColor}` }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sessionCfg.hex }} />
                      <span className="text-sm font-semibold" style={{ color: sessionCfg.hex }}>
                        {sessionCfg.label}
                      </span>
                    </div>
                    {(isTestSession || session.status === "available") && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {isTestSession ? t("test-session-description") : t("session-status")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer ── */}
              {showFooter && (
                <div className="shrink-0 px-5 py-4 border-t border-border/60 bg-muted/20">
                  {session.status === "available" ? (
                    <button
                      type="button"
                      disabled={isBooking}
                      onClick={() => onBookSession(session)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isBooking ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <IconCalendarEvent className="h-4 w-4" />
                      )}
                      {isBooking
                        ? t("buttons.booking") || "Booking..."
                        : isTestSession
                        ? t("buttons.book-test")
                        : t("buttons.book")}
                    </button>
                  ) : session.status === "regular" ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconRepeat className="h-3.5 w-3.5 shrink-0" />
                        <span>{tE("recurring-note")}</span>
                      </div>
                      <button
                        type="button"
                        disabled={!canCancel}
                        onClick={() => setCancelDialogOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <IconX className="h-4 w-4" />
                        {t3("cancel")}
                      </button>
                      {!canCancel && (
                        <p className="text-xs text-muted-foreground text-center">
                          {tCancel("unable-to-cancel") || "Cannot cancel sessions within 24 hours"}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        disabled={!canCancel || isCancelling}
                        onClick={() => setCancelBookedDialogOpen(true)}
                        className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive border border-destructive/30 hover:bg-destructive/8 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <IconX className="h-4 w-4" />
                        {t3("cancel")}
                      </button>
                      {!canCancel && (
                        <p className="text-xs text-muted-foreground text-center">
                          {tCancel("unable-to-cancel") || "Cannot cancel sessions within 24 hours"}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {/* Cancel Regular Session Dialog */}
          {session?.status === "regular" && session.invitationId && (
            <CancelRegularSessionDialog
              open={cancelDialogOpen}
              onOpenChange={setCancelDialogOpen}
              invitationId={session.invitationId}
              sessionDate={new Date(session.startTime)}
              tutorName={session.tutorName}
              locale={locale}
            />
          )}

          {/* Cancel Booked Session Dialog */}
          <AlertDialog open={cancelBookedDialogOpen} onOpenChange={setCancelBookedDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{tCancelDialog("title")}</AlertDialogTitle>
                <AlertDialogDescription>{tCancelDialog("description")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t3("go-back")}</AlertDialogCancel>
                <Button variant="destructive" onClick={onCancelBookedSession}>
                  {isCancelling ? t3("cancelling") : t3("cancel")}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </SheetContent>
      </Sheet>
    </>
  );
};
