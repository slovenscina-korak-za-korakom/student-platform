"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  IconCalendar,
  IconUsers,
  IconUser,
  IconRepeat,
} from "@tabler/icons-react";
import {LangClubEvent, PersonalSession, RegularSession} from "@/types/interfaces";
import { SESSION_COLORS, hexToRgba } from "@/lib/session-colors";


interface DashboardStatsProps {
  langClubEvents: LangClubEvent[];
  personalSessions: PersonalSession[];
  regularSessions: RegularSession[];
}

const DashboardStats = ({
  langClubEvents,
  personalSessions,
  regularSessions,
}: DashboardStatsProps) => {
  const t = useTranslations("dashboard.stats");
  const now = new Date();

  // Calculate stats
  const upcomingLangClub = langClubEvents.filter(
    (event) => new Date(event.date) > now,
  ).length;

  const upcomingPersonal = personalSessions.filter(
    (session) => new Date(session.startTime) > now,
  ).length;

  // Count unique regular invitations (not individual occurrences)
  const uniqueRegularInvitations = new Set(
    regularSessions.map((s) => s.invitationId)
  ).size;

  // Count upcoming regular sessions (individual occurrences)
  const upcomingRegular = regularSessions.filter(
    (session) => new Date(session.startTime) > now,
  ).length;

  const totalUpcoming = upcomingLangClub + upcomingPersonal + upcomingRegular;

  // const completedLangClub = langClubEvents.filter(
  //   (event) => new Date(event.date) <= now,
  // ).length;
  //
  // const completedPersonal = personalSessions.filter(
  //   (session) => new Date(session.startTime) <= now,
  // ).length;

  // const totalCompleted = completedLangClub + completedPersonal;

  const stats = [
    {
      title: t("total-upcoming"),
      value: totalUpcoming,
      icon: IconCalendar,
      color: SESSION_COLORS.individual,
      description: t("description.upcoming"),
    },
    {
      title: t("language-club"),
      value: upcomingLangClub,
      icon: IconUsers,
      color: SESSION_COLORS["language-club"],
      description: t("description.language-club"),
    },
    {
      title: t("personal-sessions"),
      value: upcomingPersonal,
      icon: IconUser,
      color: SESSION_COLORS.individual,
      description: t("description.personal-sessions"),
    },
    {
      title: t("regular-sessions"),
      value: uniqueRegularInvitations,
      icon: IconRepeat,
      color: SESSION_COLORS.regular,
      description: t("description.regular-sessions"),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="group bg-white p-2 dark:bg-[#1a1a1a] border border-border/40 dark:border-white/10 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 transition-all duration-300 ease-out rounded-xl overflow-hidden"
          >
            <CardContent className="px-5 py-4">
              <div className="flex flex-row items-start justify-between mb-5">
                <h3 className="text-xs md:text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {stat.title}
                </h3>
                <div
                  className="p-0 rounded-lg flex-shrink-0 opacity-60 group-hover:opacity-80 transition-opacity duration-300"
                  style={{ backgroundColor: hexToRgba(stat.color, 0.1) }}
                >
                  <Icon className="h-4 w-4" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-4xl md:text-5xl font-bold text-foreground tabular-nums">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground/80">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
