"use client";
import React from "react";
import { IconCheck, IconCalendar, IconClock, IconMapPin, IconStopwatch } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import {LangEvent} from "@/types/interfaces";
import {localeType} from "@/i18n/routing";

interface BookingSuccessProps {
  event: LangEvent;
  locale: localeType;
}

const BookingSuccess = ({ event, locale }: BookingSuccessProps) => {
  const t = useTranslations("dashboard.events.success-dialog");
  const eventDate = new Date(event.date);

  return (
    <div className="w-full max-w-sm mx-auto p-6">
      {/* Success icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-blue-200/50 dark:border-violet-800/50 flex items-center justify-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
            <IconCheck className="w-4 h-4 text-white stroke-[3]" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("desc")}</p>
      </div>

      {/* Event details */}
      <div className="rounded-xl border border-border/50 overflow-hidden">
        <div className="h-px w-full bg-gradient-to-r from-blue-500 to-violet-500" />
        <div className="p-4 space-y-3">
          <div>
            <p className="font-semibold text-foreground">{event.theme}</p>
            <p className="text-sm text-muted-foreground">{t("with", { name: event.tutor })}</p>
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-3.5 w-3.5 shrink-0" />
              <span>
                {eventDate.toLocaleDateString(locale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-3.5 w-3.5 shrink-0" />
              <span>
                {eventDate.toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <IconMapPin className="h-3.5 w-3.5 shrink-0" />
              <span>{t("location", { loc: event.location })}</span>
            </div>
            <div className="flex items-center gap-2">
              <IconStopwatch className="h-3.5 w-3.5 shrink-0" />
              <span>{t("duration", { time: event.duration })}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground/70 text-center mt-4">
        {t("email-message")}
      </p>
    </div>
  );
};

export default BookingSuccess;
