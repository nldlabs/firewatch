import type { EmergencyEvent } from "@shared/types/vic-emergency";
import { useEffect, useState, useMemo } from "react";
import { VICEmergencyAPI } from "../lib/vic-emergency";
import { getActionPriority } from "../lib/utils";

/**
 * Check if an event is fire-related based on category fields.
 * 
 * TRADEOFF: We check multiple fields because the VIC Emergency API is inconsistent
 * about where fire type is stored. Some events use cap.category, others use
 * category1/category2. This broad check ensures we don't miss any fire events
 * at the cost of potentially including some non-fire events.
 */
function isFireRelated(event: EmergencyEvent): boolean {
  return event.cap?.category === 'Fire' || 
         event.category1?.includes('Fire') ||
         event.category2?.includes('Fire') ||
         event.category2?.includes('Bushfire') ||
         event.category2?.includes('Grass Fire') ||
         event.category1?.includes('Burn') ||
         event.name?.toLowerCase().includes('fire');
}

/**
 * Sort events by action priority, then severity.
 * This ensures "Shelter In Place" and "Leave Immediately" events appear first.
 */
function sortByPriority(a: EmergencyEvent, b: EmergencyEvent): number {
  const aPriority = getActionPriority(a.action);
  const bPriority = getActionPriority(b.action);
  if (aPriority !== bPriority) return bPriority - aPriority;
  
  const severityOrder: Record<string, number> = { 'Extreme': 0, 'Moderate': 1, 'Minor': 2 };
  const aOrder = severityOrder[a.status || a.cap?.severity || 'Minor'] ?? 3;
  const bOrder = severityOrder[b.status || b.cap?.severity || 'Minor'] ?? 3;
  return aOrder - bOrder;
}

// =============================================================================
// TRADEOFF: Polling Interval
// =============================================================================
// We poll every 15 seconds rather than using WebSocket/SSE because:
// 1. The VIC Emergency API doesn't offer real-time connections
// 2. 15s is fast enough for situational awareness without hammering the server
// 3. We use delta hashing to skip full fetches when data hasn't changed
// =============================================================================
const POLL_INTERVAL_MS = 15000;

export function useFireEvents() {
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Initial load
  useEffect(() => {
    const init = async () => {
      try {
        const newEvents = await VICEmergencyAPI.getEvents();
        setEvents(newEvents);
        setLastUpdated(new Date());
        setLoading(false);
        
        // Get delta hash in background (don't block UI)
        VICEmergencyAPI.getDelta()
          .then(delta => setLastHash(delta.lastHash))
          .catch(() => {});
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
        setLoading(false);
      }
    };
    void init();
  }, []);

  // Poll for updates
  useEffect(() => {
    if (!lastHash) return;
    
    const checkForUpdates = async () => {
      try {
        const delta = await VICEmergencyAPI.getDelta();
        if (delta.lastHash !== lastHash) {
          setLastHash(delta.lastHash);
          const newEvents = await VICEmergencyAPI.getEvents();
          setEvents(newEvents);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Delta check failed:', err);
      }
    };
    
    const interval = setInterval(checkForUpdates, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [lastHash]);

  // Filter and sort fire events
  const fireEvents = useMemo(() => 
    events.filter(isFireRelated).sort(sortByPriority),
    [events]
  );
  
  const fireWarnings = useMemo(() => 
    fireEvents.filter(e => e.feedType === 'warning'),
    [fireEvents]
  );

  return {
    fireEvents,
    fireWarnings,
    loading,
    error,
    lastUpdated,
    totalWarnings: fireWarnings.length,
    totalIncidents: fireEvents.length - fireWarnings.length,
  };
}
