// Date formatting utility functions
export const useDateFormatters = () => {
  
  // Format minutes to hours and minutes
  const formatPlayTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes} minutes`;
    } else if (hours === 1) {
      return `${hours} hour ${remainingMinutes} minutes`;
    } else {
      return `${hours} hours ${remainingMinutes} minutes`;
    }
  };

  // Format play time in short format (e.g., "2h 30m")
  const formatPlayTimeShort = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (hours === 1) {
      return `${hours}h ${remainingMinutes}m`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  };

  // Format date to a readable format in the user's locale
  const formatDate = (dateString: string): string => {
    // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
    const date = new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
    const now = new Date();

    // Format time without seconds
    const timeFormat = date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();

    // Calculate the difference in days
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffTime = today.getTime() - dateDay.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Get day name
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];

    // Format date based on how recent it is
    if (diffDays === 0) {
      // Today
      return `Today at ${timeFormat}`;
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday at ${timeFormat}`;
    } else if (diffDays < 7) {
      // Within the last week
      return `${dayName} at ${timeFormat}`;
    } else {
      // More than a week ago
      const formattedDate = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      return `${formattedDate} at ${timeFormat} (${diffDays} days ago)`;
    }
  };

  // Format date to a human-readable relative time (e.g., "2 days ago")
  const formatRelativeTime = (dateString: string): string => {
    if (!dateString) return '';
    // Ensure the date is treated as UTC by appending 'Z' if it doesn't have timezone info
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
  };

  // Format timestamp for elapsed time display
  const getElapsedTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    formatPlayTime,
    formatPlayTimeShort,
    formatDate,
    formatRelativeTime,
    getElapsedTime
  };
}; 