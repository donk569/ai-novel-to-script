/**
 * Utility helpers shared across the application.
 */

/** Join class names, filtering falsy values. */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Count characters in text — Chinese characters count individually, English by words. */
export function countWords(text: string): number {
  if (!text) return 0
  // Count Chinese characters individually + English words
  const chineseChars = (text.match(/[一-鿿㐀-䶿]/g) || []).length
  const englishWords = (text.match(/[a-zA-Z0-9]+/g) || []).length
  return chineseChars + englishWords
}

/** Format a date to YYYY-MM-DD */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
