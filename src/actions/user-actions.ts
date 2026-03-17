"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import {db} from "@/db";
import {tutorsTable} from "@/db/schema";

export interface UserPreferences {
  languageLevel: string;
  preferredTutor: number;
  learningGoals: string[];
  preferredSchedule: string;
}

export const updateUserPreferences = async (preferences: UserPreferences) => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) {
    return new Error("User not found");
  }

  try {
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        preferences,
      },
    });

    return null;
  } catch (error) {
    console.error("Error saving preferences:", error);
    return error;
  }
};

export const getUserPreferences = async () => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) {
    return new Error("User not found");
  }
  try {
    const user = await client.users.getUser(userId);
    return user.privateMetadata.preferences;
  } catch (error) {
    console.error("Error getting preferences:", error);
    return error;
  }
};

export const updateLanguageLevel = async (languageLevel: string) => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) {
    return new Error("User not found");
  }

  try {
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        languageLevel,
      },
    });

    return null;
  } catch (error) {
    console.error("Error saving language level:", error);
    return error;
  }
};

export const updateEmailLocale = async (locale: string) => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) {
    return new Error("User not found");
  }

  try {
    await client.users.updateUserMetadata(userId, {
      unsafeMetadata: {
        locale,
      },
    });

    return null;
  } catch (error) {
    console.error("Error saving email locale:", error);
    return error;
  }
};

export const dismissWelcomeDialog = async () => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) return;
  try {
    await client.users.updateUserMetadata(userId, {
      unsafeMetadata: { showWelcomeDialog: false },
    });
  } catch (error) {
    console.error("Error dismissing welcome dialog:", error);
  }
};

export const getTutors = async () => {
  try {
    return await db.select().from(tutorsTable);
  } catch (error) {
    console.error("Error fetching tutors:", error);
    return [];
  }
};

export const getEmailLocale = async () => {
  const client = await clerkClient();
  const { userId } = await auth();
  if (!userId) {
    return new Error("User not found");
  }
  try {
    const user = await client.users.getUser(userId);
    return (user.unsafeMetadata.locale as string) || "en";
  } catch (error) {
    console.error("Error getting email locale:", error);
    return error;
  }
};
