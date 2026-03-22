"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconLoader2,
  IconMapPin,
  IconStopwatch,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "@/i18n/routing";
import {
  getAvailableEvents,
  rescheduleBooking,
} from "@/actions/stripe-actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Event } from "@/types/interfaces";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEvent: Event;
  bookingId: number;
  locale: string;
}

const translations = {
  en: {
    errors: {
      "failed-to-load-events": "Failed to load available events",
      "failed-to-reschedule": "Failed to reschedule booking",
      "please-select-event": "Please select an event to reschedule to",
    },
    success: {
      "booking-rescheduled": "Booking rescheduled successfully",
    },
  },
  sl: {
    errors: {
      "failed-to-load-events": "Napaka pri nalaganju dostopnih dogodkov",
      "failed-to-reschedule": "Napaka pri ponovni rezervaciji dogodka",
      "please-select-event": "Prosimo izberite dogodek za ponovno rezervacijo",
    },
    success: {
      "booking-rescheduled": "Nov dogodek uspešno rezerviran",
    },
  },
  it: {
    errors: {
      "failed-to-load-events": "Impossibile caricare gli eventi disponibili",
      "failed-to-reschedule": "Impossibile ripetere la prenotazione",
      "please-select-event": "Prosimo selezionare un evento per la ripetizione",
    },
    success: {
      "booking-rescheduled": "Prenotazione ripetuta con successo",
    },
  },
  ru: {
    errors: {
      "failed-to-load-events": "Не удалось загрузить доступные события",
      "failed-to-reschedule": "Не удалось повторно забронировать",
      "please-select-event":
        "Пожалуйста, выберите событие для повторной бронирования",
    },
    success: {
      "booking-rescheduled": "Бронь успешно повторно забронирована",
    },
  },
};

const getTranslations = (locale: string) => {
  return translations[locale as keyof typeof translations] || translations.en;
};

const RescheduleDialog = ({
  open,
  onOpenChange,
  currentEvent,
  bookingId,
  locale,
}: RescheduleDialogProps) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const t = useTranslations("dashboard.reschedule-dialog");
  const router = useRouter();
  const isMobile = useIsMobile();

  const fetchAvailableEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const response = await getAvailableEvents(currentEvent.id);
      if (response.success) {
        setEvents(response.events);
      } else {
        toast.error(getTranslations(locale).errors["failed-to-load-events"]);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error(getTranslations(locale).errors["failed-to-load-events"]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [currentEvent.id, locale]);

  useEffect(() => {
    if (open) {
      fetchAvailableEvents();
    }
  }, [open, fetchAvailableEvents]);

  const handleReschedule = async () => {
    if (!selectedEventId) {
      toast.error(getTranslations(locale).errors["please-select-event"]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await rescheduleBooking(
        bookingId.toString(),
        selectedEventId.toString(),
      );
      if (response.success) {
        toast.success(getTranslations(locale).success["booking-rescheduled"]);
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(
          response.error || getTranslations(locale).errors["failed-to-reschedule"],
        );
      }
    } catch (error) {
      console.error("Reschedule error:", error);
      toast.error(getTranslations(locale).errors["failed-to-reschedule"]);
    } finally {
      setIsLoading(false);
    }
  };

  const availableEvents = events.filter((event) => {
    const spotsLeft = event.maxBooked - event.peopleBooked;
    return spotsLeft > 0 && event.id !== currentEvent.id;
  });

  const currentDate = new Date(currentEvent.date);

  // ── Shared JSX pieces ──────────────────────────────────────────────────────

  const eventList = isLoadingEvents ? (
    <div className="flex flex-col items-center justify-center py-12 gap-2">
      <IconLoader2 className="w-5 h-5 animate-spin text-muted-foreground"/>
      <p className="text-sm text-muted-foreground">{t("loading")}</p>
    </div>
  ) : availableEvents.length > 0 ? (
    <div className="space-y-2">
      {availableEvents.map((event) => {
        const spotsLeft = event.maxBooked - event.peopleBooked;
        const isSelected = selectedEventId === event.id;
        const date = new Date(event.date);
        return (
          <div
            key={event.id}
            onClick={() => setSelectedEventId(event.id)}
            className={cn(
              "relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer",
              isSelected
                ? "border-sl-purple/50 bg-sl-purple/8 dark:bg-sl-purple/12"
                : "border-border hover:border-sl-purple/30 hover:bg-muted/40"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm font-semibold leading-tight truncate",
                isSelected ? "text-sl-purple" : "text-foreground"
              )}>
                {event.theme}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{event.tutor}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <IconCalendar className="h-3 w-3 shrink-0"/>
                  {date.toLocaleDateString(locale, {month: "short", day: "numeric", year: "numeric"})}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                  <IconClock className="h-3 w-3 shrink-0"/>
                  {date.toLocaleTimeString(locale, {hour: "2-digit", minute: "2-digit", hour12: false})}
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <IconMapPin className="h-3 w-3 shrink-0"/>
                  {event.location}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className="text-xs font-normal">
                <IconStopwatch className="h-3 w-3 mr-1"/>{event.duration}m
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-normal",
                  spotsLeft <= 2 ? "text-amber-600 border-amber-200 dark:border-amber-900" : ""
                )}
              >
                <IconUsers className="h-3 w-3 mr-1"/>{spotsLeft}
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal">{event.level}</Badge>
            </div>
            {isSelected && (
              <IconCheck className="absolute top-3 right-3 h-3.5 w-3.5 text-sl-purple"/>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <div className="flex items-center justify-center py-12">
      <p className="text-sm text-muted-foreground text-center">{t("no-available-events")}</p>
    </div>
  );

  const footerButtons = (onClose: () => void) => (
    <>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        {t("cancel")}
      </Button>
      <Button onClick={handleReschedule} disabled={!selectedEventId || isLoading}>
        {isLoading ? (
          <><IconLoader2 className="mr-2 h-4 w-4 animate-spin"/>{t("rescheduling")}</>
        ) : (
          t("reschedule")
        )}
      </Button>
    </>
  );

  // ── Mobile: Drawer ─────────────────────────────────────────────────────────

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerTitle className="sr-only">{t("title")}</DrawerTitle>
          <DrawerDescription className="sr-only">{t("description")}</DrawerDescription>

          {/* Gradient header */}
          <div
            className="px-5 py-4 flex items-center justify-between shrink-0"
            style={{background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"}}
          >
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest">
                {t("title")}
              </p>
              <p className="text-white font-bold text-base leading-snug truncate">
                {currentEvent.theme}
              </p>
            </div>
            <DrawerClose className="cursor-pointer p-1.5 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-colors ml-3 shrink-0">
              <IconX className="h-4 w-4"/>
            </DrawerClose>
          </div>

          {/* Event list */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
              {t("select-new")}
            </p>
            {eventList}
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-4 py-4 border-t border-border/60 shrink-0 bg-background dark:bg-sidebar">
            {footerButtons(() => onOpenChange(false))}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // ── Desktop: Dialog ────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 border-0 shadow-2xl rounded-2xl overflow-hidden flex flex-row w-[calc(100vw-2rem)] sm:max-w-[680px] sm:h-[560px]"
      >
        <DialogTitle className="sr-only">{t("title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("description")}</DialogDescription>

        {/* Left gradient panel */}
        <div
          className="w-[190px] shrink-0 flex flex-col"
          style={{background: "linear-gradient(170deg, #2563eb 0%, #7c3aed 55%, #6d28d9 100%)"}}
        >
          <div className="px-5 pt-6 pb-4">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-4">
              <IconCalendar className="h-5 w-5 text-white"/>
            </div>
            <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-1">
              {t("title")}
            </p>
            <h2 className="text-white text-lg font-bold leading-snug">
              Pick a<br/>New Date
            </h2>
          </div>

          <div className="mx-5 h-px bg-white/10"/>

          {/* Current event summary */}
          <div className="px-5 py-4 flex-1 space-y-3.5">
            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1">
                {t("current-event")}
              </p>
              <p className="text-white text-sm font-semibold leading-snug line-clamp-3">
                {currentEvent.theme}
              </p>
              <p className="text-white/60 text-xs mt-1">{currentEvent.tutor}</p>
            </div>

            <div className="h-px bg-white/10"/>

            <div>
              <p className="text-white/40 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                Date & Time
              </p>
              <p className="text-white text-sm font-semibold tabular-nums">
                {currentDate.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
              <p className="text-white/60 text-xs mt-0.5 tabular-nums flex items-center gap-1">
                <IconClock className="h-3 w-3"/>
                {currentDate.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-background dark:bg-sidebar">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{t("select-new")}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t("description")}</p>
            </div>
            <DialogClose className="cursor-pointer p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <IconX className="h-4 w-4"/>
            </DialogClose>
          </div>

          {/* Scrollable event list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {eventList}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border/60 shrink-0">
            {footerButtons(() => onOpenChange(false))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
