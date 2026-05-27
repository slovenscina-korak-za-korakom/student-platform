/* eslint-disable @typescript-eslint/no-explicit-any */
// Types
export interface Tutor {
  id: number;
  name: string;
  avatar: string;
  color: string;
  email: string;
  phone: string;
  bio: string;
  specializations: string[];
}

export interface TutoringSession {
  id: string;
  tutorId: number;
  tutorName: string;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  sessionType: string;
  location: string;
  status: string;
  description: string;
  videoCallUrl?: string | null;
  // Regular session specific fields
  isRecurring?: boolean;
  invitationId?: number;
  studentId?: string;
}

// More flexible type for session array
export type TutoringSessionArray = TutoringSession[];

export interface DateClickArg {
  dateStr: string;
  date: Date;
  allDay: boolean;
  dayEl: HTMLElement;
  jsEvent: MouseEvent;
  view: any;
}

export interface EventClickArg {
  event: any;
  jsEvent: MouseEvent;
  view: any;
}

export interface EventDropArg {
  event: any;
  oldEvent: any;
  delta: any;
  revert: () => void;
}

export interface EventResizeArg {
  event: any;
  startDelta: any;
  endDelta: any;
  revert: () => void;
}
