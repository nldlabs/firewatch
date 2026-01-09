/**
 * Portfolio note: This client fetches public data directly from VIC Emergency.
 * Tradeoffs:
 * - Simplicity: No backend or API proxy; fewer moving parts (YAGNI).
 * - Reliability: Depends on third-party uptime, CORS, and rate limits.
 * - Privacy: No user data is sent; all processing is client-side.
 * - Future: If stability becomes a concern, introduce a tiny cache/proxy.
 */
import type { 
  EmergencyEventsResponse, 
  EmergencyDeltaResponse,
  EmergencyEvent,
  EmergencyFeature
} from '@shared/types/vic-emergency';

// Extract point coordinates from a feature's geometry
function extractCoordinates(feature: EmergencyFeature): [number, number] | null {
  const { geometry } = feature;
  
  // Direct Point geometry
  if (geometry.type === 'Point' && geometry.coordinates) {
    const coords = geometry.coordinates as number[];
    return [coords[0], coords[1]];
  }
  
  // GeometryCollection - find the Point
  if (geometry.type === 'GeometryCollection' && geometry.geometries) {
    const point = geometry.geometries.find(g => g.type === 'Point');
    if (point && point.coordinates) {
      const coords = point.coordinates as number[];
      return [coords[0], coords[1]];
    }
  }
  
  return null;
}

// Extract polygon coordinates from a feature's geometry
function extractPolygon(feature: EmergencyFeature): [number, number][] | null {
  const { geometry } = feature;
  
  // Direct Polygon geometry
  if (geometry.type === 'Polygon' && geometry.coordinates) {
    const ring = (geometry.coordinates as number[][][])[0];
    return ring.map(coord => [coord[0], coord[1]]);
  }
  
  // GeometryCollection - find the Polygon
  if (geometry.type === 'GeometryCollection' && geometry.geometries) {
    const polygon = geometry.geometries.find(g => g.type === 'Polygon');
    if (polygon && polygon.coordinates) {
      const ring = (polygon.coordinates as number[][][])[0];
      return ring.map(coord => [coord[0], coord[1]]);
    }
  }
  
  return null;
}

// Fetch with retry for transient network errors
async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (err) {
      const isLastAttempt = i === retries - 1;
      if (isLastAttempt) throw err;
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Fetch failed after retries');
}

export const VICEmergencyAPI = {
  // Check if data has changed (lightweight call)
  getDelta: async (): Promise<EmergencyDeltaResponse> => {
    const response = await fetchWithRetry('https://emergency.vic.gov.au/public/osom-delta.json');
    return response.json();
  },

  // Get all events with coordinates extracted for map display
  getEvents: async (): Promise<EmergencyEvent[]> => {
    const response = await fetchWithRetry('https://emergency.vic.gov.au/public/events-geojson.json');
    const data: EmergencyEventsResponse = await response.json();
    
    return data.features.map(feature => ({
      ...feature.properties,
      coordinates: extractCoordinates(feature),
      polygon: extractPolygon(feature)
    }));
  }
}; 

