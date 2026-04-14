"use client";
import React, { useRef, useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Button } from "@/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useTranslations } from "next-intl";
import "@/components/calendar/calendar-styles.css";
import {LangEvent} from "@/types/interfaces";
import {useCalendarResize} from "@/hooks/use-calendar-resize";

const LangCalendar = ({ locale, events, setDate }: {locale: string, events: LangEvent[], setDate: (date: Date) => void}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const containerRef = useCalendarResize(calendarRef)
  const [title, setTitle] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations("dashboard.calendar");

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const calendarEvents = events.map((event) => ({
    id: event.id.toString(),
    title: " ",
    start: new Date(event.date),
    allDay: true,
  }));

  return (
    <div className="flex flex-col w-full h-full">
      {/* Custom header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 border-border/50"
          onClick={() => {
            calendarRef.current?.getApi().today();
            setDate(new Date());
          }}
        >
          {t("today-button")}
        </Button>

        <span className="text-sm font-medium capitalize">{title}</span>

        <div className="flex items-center gap-0.5">
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => calendarRef.current?.getApi().prev()}
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => calendarRef.current?.getApi().next()}
          >
            <IconChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <div ref={containerRef} className="flex-1 min-h-0 px-3 pb-3">
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
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={false}
          locale={locale}
          events={calendarEvents}
          height={isMobile ? "auto" : "100%"}
          firstDay={1}
          dayMaxEvents={false}
          weekNumbers={false}
          dateClick={(info) => setDate(info.date)}
          datesSet={(info) => setTitle(info.view.title)}
          eventContent={() => (
            <div className="flex justify-center items-center w-full py-0.5">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "linear-gradient(to bottom, #3b82f6, #7c3aed)",
                  width: isMobile ? "6px" : "12px",
                  height: isMobile ? "6px" : "12px",
                  borderRadius: isMobile ? "999px" : "3px",
                  border: "none",
                }}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
};

export default LangCalendar;
