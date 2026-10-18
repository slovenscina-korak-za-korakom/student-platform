import { InferSelectModel } from "drizzle-orm"
import { coursesTable, sectionsTable, videosTable } from "@/db/schema"
import { slugify } from "@/lib/utils"

/**
 * Placeholder course data for developing the courses UI without a database.
 * Shapes mirror the server action return types:
 *  - `mockCourse`  → CourseWithContent (used by course-content.tsx)
 *  - `mockSection` → SectionWithContent (used by module-content.tsx)
 *
 * Durations are in seconds.
 */

type Course = InferSelectModel<typeof coursesTable>
type Section = InferSelectModel<typeof sectionsTable>
type Video = InferSelectModel<typeof videosTable>

export type MockCourse = Course & {
  sections: (Section & { videos: Video[] })[]
  videoCount: number
}

export type MockSection = Section & {
  course: Course
  videos: Video[]
}

/** Summary shape used by the courses list / course-card. */
export type MockCourseSummary = Course & { sections: number; videos: number }

/**
 * Placeholder source for a module's lecture-notes PDF.
 * In production this is replaced by the real, access-controlled file (e.g. a
 * private Uploadcare URL or signed link) resolved per section in the API route.
 * The client never sees this value — it's streamed through /api/courses/notes.
 */
export const mockNotesSource =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf"

export const mockNotesTitle = "Lecture notes"

/** Placeholder source for the written test answers (the answer key). */
export const mockAnswersSource =
  "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"

export const mockAnswersTitle = "Written answers"

/** A single multiple-choice question for the module test. */
export type QuizQuestion = {
  id: number
  question: string
  options: { id: string; text: string }[]
  correctAnswer: string
}

/** Placeholder 3-question test shown under a module's video. */
export const moduleQuiz: QuizQuestion[] = [
  {
    id: 1,
    question: "Kako rečemo \"hello\" po slovensko? (placeholder)",
    options: [
      { id: "a", text: "Hvala" },
      { id: "b", text: "Živjo" },
      { id: "c", text: "Nasvidenje" },
    ],
    correctAnswer: "b",
  },
  {
    id: 2,
    question: "Placeholder question — which word means \"thank you\"?",
    options: [
      { id: "a", text: "Prosim" },
      { id: "b", text: "Oprosti" },
      { id: "c", text: "Hvala" },
    ],
    correctAnswer: "c",
  },
  {
    id: 3,
    question: "Placeholder question — \"nasvidenje\" means…?",
    options: [
      { id: "a", text: "Goodbye" },
      { id: "b", text: "Good morning" },
      { id: "c", text: "Please" },
    ],
    correctAnswer: "a",
  },
]

const course: Course = {
  id: 1,
  title: "Slovenian for Beginners (A1)",
  description:
    "Start speaking Slovenian from day one. This course walks you through the essentials — greetings, pronunciation, everyday vocabulary and the grammar you need to hold your first conversations.",
  thumbnail: "https://www.slovenscinakzk.com/meta-image-link.jpg",
  level: "A1",
  order: 0,
  status: "active",
}

const sections: (Section & { videos: Video[] })[] = [
  {
    id: 1,
    title: "Getting Started",
    description:
      "Meet your tutor, learn how the course works, and get comfortable with the Slovenian alphabet and sounds.",
    courseId: 1,
    isFinished: true,
    order: 0,
    videos: [
      {
        id: 1,
        title: "Welcome to the course",
        description: "A quick tour of what you'll learn and how to get the most out of each module.",
        duration: 185,
        videoLink: "",
        order: 0,
        sectionId: 1,
        isFinished: true,
      },
      {
        id: 2,
        title: "The Slovenian alphabet",
        description: "All 25 letters, including č, š and ž, with pronunciation tips.",
        duration: 612,
        videoLink: "",
        order: 1,
        sectionId: 1,
        isFinished: true,
      },
      {
        id: 3,
        title: "Sounds & pronunciation",
        description: "Train your ear and mouth for the trickier Slovenian sounds.",
        duration: 498,
        videoLink: "",
        order: 2,
        sectionId: 1,
        isFinished: true,
      },
    ],
  },
  {
    id: 2,
    title: "Greetings & Introductions",
    description:
      "Say hello, introduce yourself, and ask someone how they're doing — formally and informally.",
    courseId: 1,
    isFinished: false,
    order: 1,
    videos: [
      {
        id: 4,
        title: "Hello & goodbye",
        description: "Zdravo, živjo, nasvidenje — and when to use each.",
        duration: 420,
        videoLink: "",
        order: 0,
        sectionId: 2,
        isFinished: false,
      },
      {
        id: 5,
        title: "Introducing yourself",
        description: "Share your name, where you're from, and what you do.",
        duration: 536,
        videoLink: "",
        order: 1,
        sectionId: 2,
        isFinished: false,
      },
    ],
  },
  {
    id: 3,
    title: "Numbers & Dates",
    description: null, // intentionally empty to exercise the placeholder description
    courseId: 1,
    isFinished: false,
    order: 2,
    videos: [
      {
        id: 6,
        title: "Counting 0–20",
        description: null,
        duration: 390,
        videoLink: "",
        order: 0,
        sectionId: 3,
        isFinished: false,
      },
      {
        id: 7,
        title: "Days of the week",
        description: "Ponedeljek to nedelja, plus how to say 'today' and 'tomorrow'.",
        duration: 455,
        videoLink: "",
        order: 1,
        sectionId: 3,
        isFinished: false,
      },
      {
        id: 8,
        title: "Telling the time",
        description: "Ask for and give the time in everyday situations.",
        duration: 503,
        videoLink: "",
        order: 2,
        sectionId: 3,
        isFinished: false,
      },
    ],
  },
  {
    id: 4,
    title: "Everyday Conversations",
    description: "Put it all together with short dialogues you'll actually use.",
    courseId: 1,
    isFinished: false,
    order: 3,
    videos: [
      {
        id: 9,
        title: "At the café",
        description: "Order a coffee and chat with the barista.",
        duration: 648,
        videoLink: "",
        order: 0,
        sectionId: 4,
        isFinished: false,
      },
    ],
  },
]

export const mockCourse: MockCourse = {
  ...course,
  sections,
  videoCount: sections.reduce((sum, s) => sum + s.videos.length, 0),
}

export const mockSection: MockSection = {
  ...sections[0],
  course,
}

/** The courses list, in the summary shape the course-card expects. */
export const mockCourses: MockCourseSummary[] = [
  {
    ...course,
    sections: mockCourse.sections.length,
    videos: mockCourse.videoCount,
  },
]

/** Look up the mock course by its title slug (used by the course route). */
export function getMockCourse(slug: string): MockCourse | undefined {
  return slugify(mockCourse.title) === slug ? mockCourse : undefined
}

/** Look up a mock module by its title slug (used by the module route). */
export function getMockSection(slug: string): MockSection | undefined {
  const section = mockCourse.sections.find((s) => slugify(s.title) === slug)
  if (!section) return undefined
  return { ...section, course }
}
