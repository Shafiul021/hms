/**
 * Formats a Date object or string into a human-readable format.
 * Example: 2026-06-25T14:30:00Z -> Jun 25, 2026, 2:30 PM
 */
export const formatDate = (dateString, includeTime = true) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';

    const dateOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    };

    const timeOptions = { 
        hour: '2-digit', 
        minute: '2-digit' 
    };

    const options = includeTime 
        ? { ...dateOptions, ...timeOptions } 
        : dateOptions;

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 6000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
};
