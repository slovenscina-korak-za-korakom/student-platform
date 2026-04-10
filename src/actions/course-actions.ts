"use server"

import {auth} from "@clerk/nextjs/server";
import {db} from "@/db";
import {coursesTable, sectionsTable, videosTable} from "@/db/schema";
import {eq, sql} from "drizzle-orm";

export const getCourses = async () => {
  const {userId} = await auth()
  if (!userId) return {error: "Unauthorized", status: 401};

  try {
    const courses = await db.select({
      id: coursesTable.id,
      title: coursesTable.title,
      description: coursesTable.description,
      thumbnail: coursesTable.thumbnail,
      level: coursesTable.level,
      order: coursesTable.order,
      sections: sql<number>`(select count(*) from sections where sections.${sql.identifier(sectionsTable.courseId.name)} = courses.id)
                            ::int`,
      videos: sql<number>`(select count(*)
                           from videos
                                  inner join sections on videos.${sql.identifier(videosTable.sectionId.name)} = sections.id
                           where sections.${sql.identifier(sectionsTable.courseId.name)} = courses.id)
                          ::int`,
    }).from(coursesTable);

    return {courses, status: 200};

  } catch (error) {
    console.error(error)
    return {error: error instanceof Error ? error.message : "Internal Server Error", status: 500};
  }
};

export const getCourseInfo = async (courseId: number) => {
  const {userId} = await auth()
  if (!userId) return {error: "Unauthorized", status: 401};

  try {
    const data = await db.query.coursesTable.findFirst({
      where: eq(coursesTable.id, courseId),
      with: {
        sections: {
          orderBy: (sections, {asc}) => [asc(sections.order)],
          with: {
            videos: {
              orderBy: (videos, {asc}) => [asc(videos.order)],
            },
          },
        },
      },
    });

    const course = data ? {
      ...data,
      videoCount: data.sections.reduce((sum, s) => sum + s.videos.length, 0),
    } : undefined;

    return {course, status: 200};
  } catch (error) {
    console.error(error)
    return {error: error instanceof Error ? error.message : "Internal Server Error"}
  }
}


