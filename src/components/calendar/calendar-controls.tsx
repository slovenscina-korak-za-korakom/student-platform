import React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {Button} from "../ui/button";
import {IconChevronDown, IconChevronLeft, IconChevronRight,} from "@tabler/icons-react";
import {Tutor} from "@/components/calendar/types";
import {TutorAvatars} from "@/components/calendar/tutor-avatars";
import {cn} from "@/lib/utils";
import {useTranslations} from "next-intl";

type CalendarControlsProps = {
  calendarTitle: string,
  setShowWeekends: (showWeekends: boolean) => void,
  goToPrev: () => void,
  goToNext: () => void,
  goToToday: () => void,
  isViewDropdownOpen: boolean,
  setIsViewDropdownOpen: (isViewDropdownOpen: boolean) => void,
  currentView: string,
  changeView: (view: string) => void,
  showWeekends: boolean,
  tutors: Tutor[],
  preferredTutorId: number | null,
  selectedTutorId: number | null,
  showBookedSessions?: boolean,
  setBookedSessions?: (showBookedSessions: boolean) => void,
  onTutorSelect?: (tutorId: number) => void,
};

export const CalendarControls = (props: CalendarControlsProps) => {
  const t = useTranslations("calendar.controls")
  return (
    <div className="relative flex flex-col gap-4 mb-6 border-b border-border pb-4">
      {/* Calendar Title */}
      <div className="flex items-center gap-2 justify-center">
        <h2 className="text-4xl tracking-tighter font-semibold">
          {props.calendarTitle}
        </h2>
      </div>

      {/* Navigation Controls - Centered on mobile, left-aligned on desktop */}
      <div className="flex flex-col md:flex-row items-center gap-4 justify-center w-full md:justify-between">
        <div className="flex items-center justify-center gap-2 translate-y-1">
        <Button onClick={props.goToPrev} variant="outline" size="sm">
          <IconChevronLeft className="h-4 w-4"/>
        </Button>

        <DropdownMenu
          open={props.isViewDropdownOpen}
          onOpenChange={props.setIsViewDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-32 justify-between">
              {props.currentView === "dayGridMonth" && t("month")}
              {props.currentView === "timeGridWeek" && t("week")}
              {props.currentView === "timeGridDay" && t("day")}
              {props.currentView === "timeGrid2Day" && t("days", {num:2})}
              {props.currentView === "timeGrid3Day" && t("days", {num:3})}
              {props.currentView === "listWeek" && "List"}
              <IconChevronDown className="h-4 w-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem
              onSelect={() => props.changeView("timeGridDay")}
            >
              {t("day")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => props.changeView("timeGridWeek")}
            >
              {t("week")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => props.changeView("dayGridMonth")}
            >
              {t("month")}
            </DropdownMenuItem>

            <DropdownMenuSeparator/>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t("num-of-days")}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      props.changeView("timeGrid2Day");
                      props.setIsViewDropdownOpen(false);
                    }}
                  >
                    {t("days", {num:2})}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault();
                      props.changeView("timeGrid3Day");
                      props.setIsViewDropdownOpen(false);
                    }}
                  >
                    {t("days", {num:3})}
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator/>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>{t("view-options")}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuCheckboxItem
                    checked={props.showWeekends}
                    onCheckedChange={props.setShowWeekends}
                  >
                    {t("weekend")}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={props.goToNext} variant="outline" size="sm">
          <IconChevronRight className="h-4 w-4"/>
        </Button>

        <Button onClick={props.goToToday} variant="outline" size="sm">
          {t("today")}
        </Button>
        </div>

      {/* My Bookings and Tutor Selection - Centered on mobile, right-aligned on desktop */}
      <div className="flex flex-row items-center gap-2 justify-center md:justify-end">
        {/* Toggle to show booked sessions */}
        <Button onClick={() => props.setBookedSessions(!props.showBookedSessions)} variant={"link"} size="sm"
                className={"p-0 text-sm flex items-end hover:no-underline cursor-pointer w-24"}>
          <span className={cn(
            "text-sm text-muted-foreground text-center max-w-32 truncate",
            props.showBookedSessions && "text-indigo-500 font-semibold"
          )}>
            {t("my-bookings")}
          </span>
          <div className={cn(
            "w-full max-w-24 translate-y-[1px] h-[2px] bg-indigo-500 absolute bottom-0 opacity-0 transition-opacity duration-300",
            props.showBookedSessions && "opacity-100",
          )}/>
        </Button>

        {/* Tutor Selection */}
        <TutorAvatars
          tutors={props.tutors}
          preferredTutorId={props.preferredTutorId}
          selectedTutorId={props.selectedTutorId}
          disabled={props.showBookedSessions}
          setBooked={props.setBookedSessions}
          onTutorSelect={props.onTutorSelect}
        />
      </div>
      </div>
    </div>
  );
};
