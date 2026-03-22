"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconCalendar,
  IconMapPin,
  IconStopwatch,
  IconUsers,
  IconLoader2,
} from "@tabler/icons-react";
import { useRouter } from "@/i18n/routing";
import {
  getAvailableEvents,
  rescheduleBooking,
} from "@/actions/stripe-actions";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {Event} from "@/types/interfaces";

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

  // Fetch available events for rescheduling
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
          response.error ||
            getTranslations(locale).errors["failed-to-reschedule"],
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-2xl max-h-[80vh] overflow-y-auto w-full bg-white dark:bg-background rounded-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">{t("current-event")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("with", {
                theme: currentEvent.theme,
                tutor: currentEvent.tutor,
              })}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(currentEvent.date).toLocaleDateString(locale, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false
              })}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-3">{t("select-new")}:</h3>
            {isLoadingEvents ? (
              <div className="flex items-center justify-center p-8">
                <IconLoader2 className="w-6 h-6 animate-spin" />
                <span className="ml-2">{t("loading")}</span>
              </div>
            ) : availableEvents.length > 0 ? (
              <div className="grid gap-3 p-1 max-h-96 overflow-y-auto">
                {availableEvents.map((event) => {
                  const spotsLeft = event.maxBooked - event.peopleBooked;
                  return (
                    <Card
                      key={event.id}
                      className={`cursor-pointer transition-colors ${
                        selectedEventId === event.id
                          ? "ring-2 ring-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{event.theme}</h4>
                            <p className="text-sm text-muted-foreground">
                              {t("with", {
                                theme: event.theme,
                                tutor: event.tutor,
                              })}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <IconCalendar className="w-4 h-4" />
                              <span className="text-sm">
                                {new Date(event.date).toLocaleDateString(locale, {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <IconMapPin className="w-4 h-4" />
                              <span className="text-sm">{event.location}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline">
                              <IconStopwatch className="w-3 h-3" />
                              {event.duration}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                spotsLeft > 2
                                  ? ""
                                  : "text-red-500 border-red-300"
                              }
                            >
                              <IconUsers className="w-3 h-3 mr-1" />
                              {spotsLeft}
                            </Badge>
                            <Badge variant="secondary">{event.level}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t("no-available-events")}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleReschedule}
            disabled={!selectedEventId || isLoading}
          >
            {isLoading ? (
              <>
                <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("rescheduling")}
              </>
            ) : (
              t("reschedule")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
