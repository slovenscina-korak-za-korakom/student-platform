import React from "react";
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Tutor} from "@/components/calendar/types";
import {cn} from "@/lib/utils";
import {useSidebar} from "@/components/ui/sidebar";

interface TutorAvatarsProps {
  tutors: Tutor[],
  preferredTutorId: number | null,
  selectedTutorId: number | null,
  disabled?: boolean,
  setBooked?: (showBookedSessions: boolean) => void,
  onTutorSelect?: (tutorId: number) => void,
}

export const TutorAvatars: React.FC<TutorAvatarsProps> = ({
                                                            tutors,
                                                            preferredTutorId,
                                                            selectedTutorId,
                                                            disabled,
                                                            setBooked,
                                                            onTutorSelect,
                                                          }) => {
  const {isMobile} = useSidebar()
  const speakingTutorIds = process.env.NEXT_PUBLIC_SPEAKING_TUTORS?.split(",").map(Number) ?? []
  const shownTutors = [...new Set([...speakingTutorIds, ...(preferredTutorId != null ? [preferredTutorId] : [])])]
  return (
    <div className="flex items-center">
      <div className="flex items-end gap-2">
        {/* Selected Tutor Avatar */}
        <div className={"flex flex-row lg:gap-1 items-center justify-center"}>
        {tutors.filter((tutor) => shownTutors.includes(tutor.id)).map((tutor, index) => (
          <Button
            key={tutor.id}
            size="sm"
            variant={"link"}
            onClick={() => { setBooked?.(false); onTutorSelect?.(tutor.id); }}
            className={"relative h-fit w-fit lg:w-36 p-0 rounded-full flex flex-row items-center justify-center translate-y-2 gap-2 hover:no-underline cursor-pointer"}
          >
            <Avatar className="h-8 w-8 rounded-full border-[1px] border-white lg:border-none" style={{
              translate: isMobile ? (-index*10).toString()+"px": "none",
              zIndex: index
            }}>
              <AvatarImage src={tutor.avatar} alt={tutor.name}/>
              <AvatarFallback className="text-base bg-foreground/50 text-background">
                {tutor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <span className={cn(
              "hidden capitalize lg:block text-sm text-muted-foreground text-center truncate",
              selectedTutorId === tutor.id && !disabled && "text-indigo-500 font-semibold"
            )}>
              {tutor.name.split(" ")[0]}
            </span>
            <div style={{
              translate: isMobile ? (-index*10).toString()+"px": "none",
            }} className={cn(
              "w-full translate-y-[1px] h-[2px] bg-indigo-500 absolute -bottom-[11px] opacity-0 transition-opacity duration-300",
              selectedTutorId === tutor.id && !disabled && "opacity-100",
            )}/>
            <div style={{
              translate: isMobile ? (-index*10).toString()+"px": "none",
            }} className={cn(
              "lg:hidden capitalize text-xs whitespace-nowrap text-indigo-500 absolute -bottom-8 opacity-0 transition-opacity duration-300",
              selectedTutorId === tutor.id && !disabled && "opacity-100",
              index >= tutors.length - 2 ? "right-0" : "left-0"
            )}>
              {tutor.name.split(" ")[0]}
            </div>
          </Button>
        ))}
        </div>
      </div>
    </div>
  );
};
