import {LanguageLevel} from "@/lib/placement-test";

// Database tutor data (raw from database)
export interface TutorData {
  id: number;
  name: string;
  avatar: string;
  color: string;
  email: string;
  phone: string;
  bio: string;
  clerkId: string;
}

// Schedule time slot within a day
export interface ScheduleTimeSlot {
  startTime: string;
  duration: number;
  sessionType: string;
  location?: string;
}

// Schedule for a specific day of the week
export interface DaySchedule {
  day: number; // 0 = Sunday, 1 = Monday, etc.
  timeSlots: ScheduleTimeSlot[];
}

// Schedule data from database
export interface ScheduleData {
  id: number;
  ownerId: string;
  schedule: unknown;
  timezone?: string | null; // IANA timezone name, e.g. 'Europe/Ljubljana'
  createdAt?: Date;
  updatedAt?: Date;
}

// Timeblock data from database
export interface TimeblockData {
  id: number;
  tutorId: number;
  startTime: string | Date;
  duration: number;
  status: string;
  sessionType: string;
  location: string;
  description?: string;
  studentId: string;
}

export interface LangClubEvent {
  id: number;
  description: string;
  date: Date;
  tutor: string;
  location: string;
  duration: number;
  theme: string;
  bookingId: number;
  bookingStatus: string;
  level?: string;
}

export interface PersonalSession {
  id: number;
  tutorId: number;
  startTime: Date;
  duration: number;
  status: string;
  sessionType: string;
  location: string;
  studentId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
}

export interface RegularSession {
  id: string;
  invitationId: number;
  tutorId: number;
  startTime: Date;
  duration: number;
  status: "booked";
  sessionType: string;
  location: string;
  studentId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
  description: string | null;
  isRecurring: true;
  dayOfWeek: number;
}

export interface UnifiedEvent {
  id: number | string;
  type: "language-club" | "personal" | "regulars";
  date: Date;
  tutor: string;
  location: string;
  duration: number;
  theme: string;
  bookingId?: number;
  bookingStatus?: string;
  level?: string;
  tutorColor?: string;
  sessionType?: string;
  isRecurring?: boolean;
  invitationId?: number;
}

export interface PlacementTestState {
  currentQuestionIndex: number;
  levelResults: Record<LanguageLevel, { correct: number; total: number }>;
  currentLevelIndex: number;
  isTestComplete: boolean;
  finalLevel: string;
  answeredQuestions: number[]; // Track which questions have been answered
}

export interface Event {
  id: number;
  theme: string;
  date: Date;
  tutor: string;
  location: string;
  duration: number;
  maxBooked: number;
  peopleBooked: number;
  level: string;
  price: number;
}


// actions/regulars.ts
export interface RegularSession {
  id: string;
  invitationId: number;
  tutorId: number;
  startTime: Date;
  duration: number;
  status: "booked";
  sessionType: string;
  location: string;
  studentId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
  description: string | null;
  isRecurring: true;
  dayOfWeek: number;
}

export interface RegularInvitation {
  id: number;
  tutorId: number;
  studentClerkId: string | null;
  status: string;
  dayOfWeek: number;
  startTime: string; // wall-clock HH:mm in `timezone`
  duration: number;
  location: string;
  description: string | null;
  color: string | null;
  timezone: string | null; // IANA timezone name, e.g. 'Europe/Ljubljana'
  tutorName: string;
  tutorAvatar: string;
  tutorColor: string;
}

export interface CancelledSession {
  id: number;
  invitationId: number;
  cancelledDate: Date;
  reason: string | null;
}


