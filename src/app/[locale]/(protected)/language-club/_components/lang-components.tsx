"use client";
import React, {useState} from "react";
import LangCalendar from "./lang-calendar";
import LangCard from "./lang-card";
import SuccessDialog from "./success-dialog";
import {useTranslations} from "next-intl";
import {IconCalendar, IconCalendarEvent} from "@tabler/icons-react";
import {localeType} from "@/i18n/routing";
import {LangEvent} from "@/types/interfaces";

const LangComponents = ({events, locale, bookedEvent}: {events: LangEvent[], locale: localeType, bookedEvent: LangEvent }) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const filteredEvents = events.filter((event) => {
    if (!date) return false;
    const eventDateKey = new Date(event.date).toLocaleDateString("en-CA");
    const selectedDateKey = date.toLocaleDateString("en-CA");
    return eventDateKey === selectedDateKey;
  });

  const [showSuccessDialog, setShowSuccessDialog] = useState(!!bookedEvent);
  const t = useTranslations("dashboard.language-club");

  return (
    <div className="flex flex-col h-full w-full">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-10 pt-6 sm:pt-8 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-0.5 h-14 rounded-full bg-gradient-to-b from-blue-500 to-violet-500 shrink-0"/>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("subtitle")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 sm:px-6 lg:px-10 pb-6 flex flex-col lg:overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 flex-1 lg:h-full lg:min-h-0">

          {/* Calendar — primary focus, takes most space */}
          <div className="w-full lg:flex-1 lg:min-h-0">
            <div className="rounded-2xl border border-border/40 overflow-hidden h-full">
              <LangCalendar
                events={events}
                locale={locale}
                setDate={setDate}
              />
            </div>
          </div>

          {/* Events panel — secondary, fixed width on desktop */}
          <div className="w-full lg:w-md flex flex-col">
            {/* Date label */}
            <div className="flex items-center gap-2 mb-2 h-5">
              {date && (
                <>
                  <IconCalendarEvent className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0"/>
                  <span className="text-xs text-muted-foreground">
                      {t("events-for-date", {
                        date: date.toLocaleDateString(locale, {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        }),
                      })}
                    </span>
                </>
              )}
            </div>

            {/* Event cards — scrollable on both mobile and desktop */}
            <div className="flex flex-col gap-3 overflow-y-auto pb-6 lg:pb-0 max-h-[40vh] lg:max-h-none lg:flex-1">
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <LangCard event={event} locale={locale} key={event.id}/>
                ))
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-xl border border-dashed border-border/50">
                  <IconCalendar className="w-7 h-7 text-muted-foreground/30 mb-3"/>
                  <p className="text-sm font-medium text-foreground/60 mb-1">
                    {t("no-events-scheduled")}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {t("no-events-description")}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {bookedEvent && (
        <SuccessDialog
          event={bookedEvent}
          locale={locale}
          open={showSuccessDialog}
          onOpenChange={setShowSuccessDialog}
        />
      )}
    </div>
  );
};

export default LangComponents;
