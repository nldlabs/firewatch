import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// Event Priority & Severity Utilities
// ============================================================================

/**
 * Get action priority for sorting/display.
 * Higher values = more critical actions requiring immediate response.
 */
export function getActionPriority(action?: string): number {
  if (!action) return 0;
  const normalizedAction = action.toLowerCase();
  if (normalizedAction.includes('shelter')) return 3; // Shelter In Place - MOST CRITICAL
  if (normalizedAction.includes('leave immediately')) return 2;
  if (normalizedAction.includes('leave')) return 1;
  return 0;
}

/**
 * Get colour for action/severity level.
 * Used for map markers, polygons, and UI indicators.
 * 
 * @param action - Event action string (e.g., "Shelter In Place")
 * @param severity - CAP severity level
 * @param status - Event status
 * @param feedType - Whether this is a 'warning' or incident
 */
export function getActionColor(action?: string, severity?: string, status?: string, feedType?: string): string {
  // Incidents (non-warnings) get more subdued colors
  const isIncident = feedType && feedType !== 'warning';
  
  const priority = getActionPriority(action);
  if (priority >= 3) return '#dc2626'; // red-600 - Shelter
  if (priority >= 2) return '#ea580c'; // orange-600 - Leave Immediately  
  if (priority >= 1) return '#f97316'; // orange-500 - Leave
  
  // For incidents, use more muted colors
  if (isIncident) {
    if (status === 'Extreme' || severity === 'Extreme') return '#b45309'; // amber-700
    if (severity === 'Moderate') return '#a16207'; // yellow-700
    if (severity === 'Minor') return '#92400e'; // amber-800
    return '#4b5563'; // gray-600 - default for incidents
  }
  
  // Warnings without specific action
  if (status === 'Extreme' || severity === 'Extreme') return '#ef4444'; // red-500
  if (severity === 'Moderate') return '#f59e0b'; // amber-500
  if (severity === 'Minor') return '#eab308'; // yellow-500
  return '#6b7280'; // gray-500
}

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago").
 */
export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
