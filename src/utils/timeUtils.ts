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

/**
 * Format time remaining in seconds to MM:SS format
 * e.g., 90 seconds becomes "1:30", 30 seconds becomes "0:30"
 * Returns "-" for invalid or negative values
 */
export function formatTimeRemaining(timeValue: number): string {
  if (!timeValue || timeValue < 0) return '-'

  const minutes = Math.floor(timeValue / 60)
  const seconds = timeValue % 60

  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format a UTC timestamp as a relative time string with extended range
 * Handles years, months, days, hours, and minutes
 * e.g., "2 years ago", "3 months ago", "5 days ago", "Just now"
 */
export function formatRelativeTime(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  } else if (diffMonths > 0) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else if (diffDays > 0) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffMinutes > 0) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Format a UTC timestamp as a compact relative time string
 * e.g., "2y", "3mo", "5d", "2h", "30m", "now"
 */
export function formatRelativeTimeShort(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d`;
  if (diffHours > 0) return `${diffHours}h`;
  if (diffMinutes > 0) return `${diffMinutes}m`;
  return 'now';
}

/**
 * Format minutes as a human-readable play time
 * e.g., "45m", "2h 30m", "<1m"
 */
export function formatPlayTime(minutes: number): string {
  if (minutes < 1) return '<1m';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  if (hours === 0) return `${remainingMinutes}m`;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate duration between two timestamps in minutes
 */
export function getDurationMinutes(startTime: string, endTime: string): number {
  if (!endTime || !startTime) return 0;
  const start = new Date(startTime.endsWith('Z') ? startTime : startTime + 'Z');
  const end = new Date(endTime.endsWith('Z') ? endTime : endTime + 'Z');
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}