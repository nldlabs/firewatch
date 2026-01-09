import { useEffect, useRef, useCallback, useState } from 'react';
import type { EmergencyEvent } from '@shared/types/vic-emergency';
import { getNearestDanger, formatDistance } from '../lib/geo-utils';

// Proximity thresholds in km
const DANGER_THRESHOLD = 5; // km - show warning
const CRITICAL_THRESHOLD = 2; // km - critical alert

// Auto-dismiss timeout (30 seconds for info, 60 for warning, never for critical)
const AUTO_DISMISS_INFO = 30000;
const AUTO_DISMISS_WARNING = 60000;

export interface Alert {
  id: string;
  type: 'proximity' | 'zone-change' | 'new-warning';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  eventId?: string | number;
  dismissed: boolean;
}

export function useAlerts(
  userLocation: [number, number] | null,
  events: EmergencyEvent[]
) {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  
  // Track if we've completed initial load
  const [isReady, setIsReady] = useState(false);
  const hasInitializedRef = useRef(false);
  
  const previousEventsRef = useRef<Map<string | number, string>>(new Map());
  const previousNearestRef = useRef<{ eventId: string | number; distance: number; isInside: boolean } | null>(null);

  // Dismiss an alert
  const dismissAlert = useCallback((id: string) => {
    setActiveAlerts(prev => prev.map(a => 
      a.id === id ? { ...a, dismissed: true } : a
    ));
  }, []);

  // Add a new alert
  const addAlert = useCallback((alert: Omit<Alert, 'id' | 'timestamp' | 'dismissed'>) => {
    const newAlert: Alert = {
      ...alert,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: Date.now(),
      dismissed: false,
    };

    setActiveAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep last 50

    // Auto-dismiss non-critical alerts after a timeout
    if (alert.severity !== 'critical') {
      const timeout = alert.severity === 'warning' ? AUTO_DISMISS_WARNING : AUTO_DISMISS_INFO;
      setTimeout(() => {
        setActiveAlerts(prev => prev.map(a => 
          a.id === newAlert.id ? { ...a, dismissed: true } : a
        ));
      }, timeout);
    }

    return newAlert;
  }, []);

  // ONE-TIME initialization effect - populate refs on first load, then mark ready
  useEffect(() => {
    if (hasInitializedRef.current || events.length === 0) return;
    
    // Populate event timestamps
    events.forEach(event => {
      previousEventsRef.current.set(event.id, event.updated);
    });
    
    // Populate user location proximity
    if (userLocation) {
      const nearestDanger = getNearestDanger(userLocation, events);
      if (nearestDanger) {
        previousNearestRef.current = {
          eventId: nearestDanger.event.id,
          distance: nearestDanger.distance,
          isInside: nearestDanger.isInside,
        };
      }
    }
    
    // Mark as initialized after a short delay to ensure refs are set
    hasInitializedRef.current = true;
    setTimeout(() => setIsReady(true), 500);
  }, [events, userLocation]);

  // Check for new/changed events - ONLY after ready
  useEffect(() => {
    if (!isReady) return;

    events.forEach(event => {
      const prevUpdated = previousEventsRef.current.get(event.id);
      const currentUpdated = event.updated;
      
      if (!prevUpdated) {
        // New event (added after initial load)
        const action = event.action?.toLowerCase() || '';
        if (action.includes('shelter') || action.includes('leave')) {
          setTimeout(() => addAlert({
            type: 'new-warning',
            severity: action.includes('shelter') ? 'critical' : 'warning',
            title: `New ${action.includes('shelter') ? 'Shelter In Place' : 'Evacuation'} Warning`,
            message: `${event.name}: ${event.location}`,
            eventId: event.id,
          }), 0);
        }
      } else if (prevUpdated !== currentUpdated) {
        // Event updated
        setTimeout(() => addAlert({
          type: 'zone-change',
          severity: 'info',
          title: 'Warning Updated',
          message: `${event.name} has been updated`,
          eventId: event.id,
        }), 0);
      }
      
      previousEventsRef.current.set(event.id, currentUpdated);
    });
  }, [events, addAlert, isReady]);

  // Check proximity for user location - ONLY after ready
  useEffect(() => {
    if (!isReady || !userLocation || events.length === 0) return;
    
    const nearestDanger = getNearestDanger(userLocation, events);
    if (!nearestDanger) return;
    
    const prev = previousNearestRef.current;
    
    // Check if something meaningful changed
    const enteredZone = nearestDanger.isInside && !prev?.isInside;
    const crossedCritical = nearestDanger.distance <= CRITICAL_THRESHOLD && (prev?.distance ?? Infinity) > CRITICAL_THRESHOLD;
    const eventChanged = prev?.eventId !== nearestDanger.event.id;
    
    // Only alert on these specific conditions:
    if (enteredZone) {
      setTimeout(() => addAlert({
        type: 'proximity',
        severity: 'critical',
        title: '⚠️ YOU ARE IN A DANGER ZONE',
        message: `You are inside: ${nearestDanger.event.name}. ${nearestDanger.event.action || 'Take action immediately!'}`,
        eventId: nearestDanger.event.id,
      }), 0);
    } else if (crossedCritical && !nearestDanger.isInside) {
      setTimeout(() => addAlert({
        type: 'proximity',
        severity: 'critical',
        title: 'Danger Zone Very Close',
        message: `${nearestDanger.event.name} is only ${formatDistance(nearestDanger.distance)} away!`,
        eventId: nearestDanger.event.id,
      }), 0);
    } else if (eventChanged && nearestDanger.distance <= DANGER_THRESHOLD) {
      // New nearest event appeared closer than 5km
      setTimeout(() => addAlert({
        type: 'proximity',
        severity: 'warning',
        title: 'New Nearby Warning',
        message: `${nearestDanger.event.name} is now the closest at ${formatDistance(nearestDanger.distance)}`,
        eventId: nearestDanger.event.id,
      }), 0);
    }

    previousNearestRef.current = {
      eventId: nearestDanger.event.id,
      distance: nearestDanger.distance,
      isInside: nearestDanger.isInside,
    };
  }, [userLocation, events, addAlert, isReady]);

  const undismissedAlerts = activeAlerts.filter(a => !a.dismissed);

  return {
    undismissedAlerts,
    dismissAlert,
  };
}
