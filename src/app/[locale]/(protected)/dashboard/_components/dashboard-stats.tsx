"use client";
import React from "react";
import {Card, CardContent} from "@/components/ui/card";
import {useTranslations} from "next-intl";
import {CancelledSession, PersonalSession, RegularInvitation} from "@/types/interfaces";
import {hexToRgba, SESSION_COLORS} from "@/lib/session-colors";
import {addWeeks, format, isBefore, setDay, startOfDay} from "date-fns";
import {fromZonedTime} from "date-fns-tz";

interface DashboardStatsProps {
  personalSessions: PersonalSession[];
  invitations: RegularInvitation[];
  cancelledSessions: CancelledSession[];
  languageLevel: string;
}

function calculatePastRegularSessions(
  invitations: RegularInvitation[],
  cancelledSessions: CancelledSession[],
): { count: number; totalMinutes: number } {
  const now = new Date();
  const today = startOfDay(now);
  let count = 0;
  let totalMinutes = 0;

  const cancelledSet = new Set(
    cancelledSessions.map(
      (cs) => `${cs.invitationId}-${startOfDay(new Date(cs.cancelledDate)).toISOString()}`,
    ),
  );

  for (const invitation of invitations) {
    const acceptedAt = startOfDay(new Date(invitation.updatedAt));

    // First occurrence of this dayOfWeek on or after acceptance date
    let currentDate = setDay(acceptedAt, invitation.dayOfWeek, {weekStartsOn: 1});
    if (isBefore(currentDate, acceptedAt)) {
      currentDate = addWeeks(currentDate, 1);
    }

    while (isBefore(currentDate, today)) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const timezone = invitation.timezone || "UTC";
      const sessionDateTime = fromZonedTime(`${dateStr}T${invitation.startTime}:00`, timezone);

      if (isBefore(sessionDateTime, now)) {
        const cancelKey = `${invitation.id}-${startOfDay(currentDate).toISOString()}`;
        if (!cancelledSet.has(cancelKey)) {
          count++;
          totalMinutes += invitation.duration;
        }
      }

      currentDate = addWeeks(currentDate, 1);
    }
  }

  return {count, totalMinutes};
}

const DashboardStats = ({
                          personalSessions,
                          invitations,
                          cancelledSessions,
                          languageLevel,
                        }: DashboardStatsProps) => {
  const t = useTranslations("dashboard.stats");
  const now = new Date();

  const pastPersonal = personalSessions.filter((s) => new Date(s.startTime) < now);
  const pastPersonalMinutes = pastPersonal.reduce((sum, s) => sum + s.duration, 0);

  const {count: pastRegularCount, totalMinutes: pastRegularMinutes} =
    calculatePastRegularSessions(invitations, cancelledSessions);

  const totalCompleted = pastPersonal.length + pastRegularCount;
  const totalMinutes = pastPersonalMinutes + pastRegularMinutes;

  const stats = [
    {id: 1, title: t("completed"), value: totalCompleted, color: SESSION_COLORS.individual},
    {id: 2, title: t("total-hours"), value: totalMinutes, color: SESSION_COLORS.individual},
    {id: 3, title: t("regular-sessions"), value: invitations.length, color: SESSION_COLORS.individual},
    {id: 4, title: t("current-level"), value: languageLevel || "—", color: SESSION_COLORS.individual},
  ];

  return (
    <div className="hidden md:grid grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-75">
      {stats.map((stat, index) => {
        return (
          <Card
            key={index}
            className="group relative bg-white dark:bg-[#1a1a1a] border shadow-[0_2px_8px_rgba(0,0,0,0.08),0_1px_3px_rgba(0,0,0,0.06)] rounded-xl overflow-hidden"
            style={{borderColor: hexToRgba(stat.color, 0.35)}}
          >
            <div
              className="absolute right-0 inset-y-0 w-2/5 bg-muted/60 dark:bg-white/5 pointer-events-none"
              style={{clipPath: "polygon(50% 0, 100% 0, 100% 100%, 0% 100%)"}}
            />
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
              <line x1="80%" y1="0%" x2="60%" y2="100%" stroke={stat.color} strokeOpacity={0.6} strokeWidth="1"/>
            </svg>
            <CardContent className="relative z-10 px-5 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-medium text-muted-foreground truncate">
                  {stat.title}
                </p>
                {stat.id === 2 ? (
                  <div className="inline-flex items-baseline gap-0.5 shrink-0">
                    <span
                      className="text-3xl font-bold text-foreground tabular-nums">{Math.floor(stat.value / 60)}</span>
                    <span className="text-base text-muted-foreground">h</span>
                    {stat.value % 60 !== 0 && (
                      <>
                        <span className="text-3xl font-bold text-foreground tabular-nums ml-1">{stat.value % 60}</span>
                        <span className="text-base text-muted-foreground">m</span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-foreground tabular-nums shrink-0">
                    {stat.value}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats;
