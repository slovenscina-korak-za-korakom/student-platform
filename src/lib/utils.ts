import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Turn a title into a URL-friendly slug, e.g. "Numbers & Dates" → "numbers-dates".
 * Folds diacritics first so Slovene letters transliterate (š→s, č→c, ž→z),
 * e.g. "Slovenščina 1" → "slovenscina-1".
 */
export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
