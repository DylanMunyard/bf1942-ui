/**
 * Time utilities for formatting dates and times in user's locale
 */

/**
 * Format a UTC timestamp as a relative time string (e.g., "5 minutes ago", "2 hours ago")
 * Properly handles UTC timestamps and converts to user's local time
 */
export function formatLastSeen(utcTimestamp: string): string {
  // Parse the UTC timestamp and ensure it's treated as UTC by appending 'Z'
  // If timestamp doesn't end with Z, append it to ensure UTC interpretation
  const utcString = utcTimestamp.endsWith('Z') ? utcTimestamp : utcTimestamp + 'Z';
  const lastSeenDate = new Date(utcString);
  const now = new Date();
  
  // Calculate the difference in milliseconds
  const diffMs = now.getTime() - lastSeenDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  }
}

/**
 * Format a UTC timestamp as an absolute time in the user's locale
 * e.g., "Dec 25, 2023 at 3:45 PM"
 */
export function formatAbsoluteTime(utcTimestamp: string): string {
  const date = new Date(utcTimestamp);
  
  return new Intl.DateTimeFormat('default', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Format a UTC timestamp as a short absolute time in the user's locale
 * e.g., "12/25 3:45 PM"
 */
export function formatShortAbsoluteTime(utcTimestamp: string): string {
  const date = new Date(utcTimestamp);
  
  return new Intl.DateTimeFormat('default', {
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}