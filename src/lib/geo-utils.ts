import area from '@turf/area';
import distance from '@turf/distance';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { polygon, point } from '@turf/helpers';
import type { EmergencyEvent } from '@shared/types/vic-emergency';
import { getActionPriority } from './utils';

// Victoria's total land area in square meters
const VICTORIA_AREA_SQ_M = 227_444 * 1_000_000; // 227,444 km²

/**
 * Calculate the area of a polygon in square kilometers
 * Polygon coords should be [lng, lat] pairs
 */
export function calculatePolygonAreaKm2(coords: [number, number][]): number {
  if (!coords || coords.length < 3) return 0;
  
  try {
    // Turf expects coords as [lng, lat], which is what we have
    // Close the polygon if not already closed
    const closedCoords = [...coords];
    if (coords[0][0] !== coords[coords.length - 1][0] || 
        coords[0][1] !== coords[coords.length - 1][1]) {
      closedCoords.push(coords[0]);
    }
    
    const poly = polygon([closedCoords]);
    const areaM2 = area(poly);
    return areaM2 / 1_000_000; // Convert to km²
  } catch {
    return 0;
  }
}

/**
 * Calculate total area under fire warnings by category
 */
export function calculateFireWarningAreas(events: EmergencyEvent[]): {
  shelterAreaKm2: number;
  leaveImmediatelyAreaKm2: number;
  leaveAreaKm2: number;
  totalWarningAreaKm2: number;
  shelterPercent: number;
  leaveImmediatelyPercent: number;
  leavePercent: number;
  totalPercent: number;
} {
  let shelterAreaKm2 = 0;
  let leaveImmediatelyAreaKm2 = 0;
  let leaveAreaKm2 = 0;

  events.forEach(event => {
    if (!event.polygon) return;
    
    const areaKm2 = calculatePolygonAreaKm2(event.polygon);
    const action = event.action?.toLowerCase() || '';
    
    if (action.includes('shelter')) {
      shelterAreaKm2 += areaKm2;
    } else if (action.includes('leave immediately')) {
      leaveImmediatelyAreaKm2 += areaKm2;
    } else if (action.includes('leave')) {
      leaveAreaKm2 += areaKm2;
    }
  });

  const totalWarningAreaKm2 = shelterAreaKm2 + leaveImmediatelyAreaKm2 + leaveAreaKm2;
  const victoriaAreaKm2 = VICTORIA_AREA_SQ_M / 1_000_000;

  return {
    shelterAreaKm2,
    leaveImmediatelyAreaKm2,
    leaveAreaKm2,
    totalWarningAreaKm2,
    shelterPercent: (shelterAreaKm2 / victoriaAreaKm2) * 100,
    leaveImmediatelyPercent: (leaveImmediatelyAreaKm2 / victoriaAreaKm2) * 100,
    leavePercent: (leaveAreaKm2 / victoriaAreaKm2) * 100,
    totalPercent: (totalWarningAreaKm2 / victoriaAreaKm2) * 100,
  };
}

/**
 * Format area for display
 */
export function formatArea(km2: number): string {
  if (km2 < 1) {
    return `${Math.round(km2 * 100) / 100} km²`;
  }
  if (km2 < 100) {
    return `${Math.round(km2 * 10) / 10} km²`;
  }
  if (km2 < 1000) {
    return `${Math.round(km2)} km²`;
  }
  return `${(km2 / 1000).toFixed(1)}k km²`;
}

/**
 * Format percentage for display
 */
export function formatPercent(percent: number): string {
  if (percent < 0.01) return '<0.01%';
  if (percent < 0.1) return `${percent.toFixed(2)}%`;
  if (percent < 1) return `${percent.toFixed(1)}%`;
  return `${Math.round(percent)}%`;
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  if (km < 10) {
    return `${km.toFixed(1)}km`;
  }
  return `${Math.round(km)}km`;
}

/**
 * Calculate distance between two points in km
 * Points should be [lng, lat]
 */
export function calculateDistance(from: [number, number], to: [number, number]): number {
  return distance(point(from), point(to), { units: 'kilometers' });
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(coords: [number, number], polygonCoords: [number, number][]): boolean {
  if (!polygonCoords || polygonCoords.length < 3) return false;
  
  try {
    const closedCoords = [...polygonCoords];
    if (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] || 
        polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1]) {
      closedCoords.push(polygonCoords[0]);
    }
    
    return booleanPointInPolygon(point(coords), polygon([closedCoords]));
  } catch {
    return false;
  }
}

/**
 * Calculate minimum distance from a point to a polygon boundary
 */
export function distanceToPolygon(coords: [number, number], polygonCoords: [number, number][]): number {
  if (!polygonCoords || polygonCoords.length < 3) return Infinity;
  
  // If inside polygon, return 0
  if (isPointInPolygon(coords, polygonCoords)) return 0;
  
  // Find minimum distance to any polygon edge
  let minDist = Infinity;
  for (let i = 0; i < polygonCoords.length; i++) {
    const dist = calculateDistance(coords, polygonCoords[i]);
    if (dist < minDist) minDist = dist;
  }
  
  return minDist;
}

export interface ProximityResult {
  event: EmergencyEvent;
  distance: number; // km, 0 if inside
  isInside: boolean;
  actionPriority: number;
}

/**
 * Calculate proximity to all warning zones from a location
 */
export function calculateProximity(
  location: [number, number],
  events: EmergencyEvent[]
): ProximityResult[] {
  return events
    .filter(e => e.polygon && e.polygon.length >= 3)
    .map(event => {
      const isInside = isPointInPolygon(location, event.polygon!);
      const dist = isInside ? 0 : distanceToPolygon(location, event.polygon!);
      return {
        event,
        distance: dist,
        isInside,
        actionPriority: getActionPriority(event.action),
      };
    })
    .sort((a, b) => {
      // Sort by inside first, then by action priority, then by distance
      if (a.isInside !== b.isInside) return a.isInside ? -1 : 1;
      if (a.actionPriority !== b.actionPriority) return b.actionPriority - a.actionPriority;
      return a.distance - b.distance;
    });
}

/**
 * Get the nearest danger zone to a location
 */
export function getNearestDanger(
  location: [number, number],
  events: EmergencyEvent[]
): ProximityResult | null {
  const proximity = calculateProximity(location, events);
  return proximity.length > 0 ? proximity[0] : null;
}
