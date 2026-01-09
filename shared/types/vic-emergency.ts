// Overall response interface
export interface EmergencyEventsResponse {
  type: "FeatureCollection";
  features: EmergencyFeature[];
}

// Delta response for efficient polling
export interface EmergencyDeltaResponse {
  lastModified: string;
  lastHash: string;
}

// Processed event with extracted coordinates for map display
export interface EmergencyEvent extends EmergencyFeatureProperties {
  coordinates: [number, number] | null; // [lng, lat] or null if no point geometry
  polygon: [number, number][] | null; // Array of [lng, lat] for polygon boundary
}

// Individual feature properties interface
export interface EmergencyFeatureProperties {
  feedType: "warning" | "incident";
  
  // CAP (Common Alerting Protocol) fields - present in warnings
  cap?: {
    category: string; // e.g., "Fire", "Met"
    event: string; // e.g., "Bushfire", "Grass Fire", "Weather"
    eventCode: string; // e.g., "bushFire", "grassFire", "weather"
    urgency: "Immediate" | "Expected" | "Unknown";
    severity: "Extreme" | "Moderate" | "Minor" | "Unknown";
    certainty: "Likely" | "Unknown";
    contact: string; // email address
    senderName: string; // e.g., "Country Fire Authority"
    responseType?: "Execute" | "Monitor";
  };
  
  // Common fields
  sourceOrg: string; // e.g., "EMV", "VIC/CFA", "VIC/SES", "NSW/RFS"
  sourceId: string | number;
  sourceFeed: string; // e.g., "cop-cap", "cfa-incident", "ses-incident"
  sourceTitle: string;
  id: string | number;
  category1: string; // e.g., "Fire", "Emergency Warning", "Tree Down"
  category2?: string; // e.g., "Bushfire", "Grass Fire", "Building Damage"
  name: string;
  location: string;
  created: string; // ISO 8601 datetime
  updated: string; // ISO 8601 datetime
  
  // Warning-specific fields
  status?: "Extreme" | "Under Control" | "Not Yet Under Control" | "Controlled" | 
          "Being Controlled" | "Safe" | "Responding" | "Complete" | "Request For Assistance" |
          "On Scene" | "Unknown";
  action?: string; // e.g., "Take Shelter Now", "Leave Immediately", "Shelter Indoors Now"
  statewide?: "Y" | "N";
  webHeadline?: string | null;
  webBody?: string;
  sizeFmt?: string | string[] | null;
  
  // Incident feature nesting
  incidentFeatures?: Array<{
    properties: {
      feedType: "incident";
      sourceOrg: string;
      sourceId: string;
      sourceFeed: string;
      sourceTitle: string;
      id: string;
      category1: string;
      category2: string;
      name: string;
      location: string;
      created: string;
      updated: string;
      webHeadline: string | null;
      sizeFmt: string | null;
    };
  }>;
  
  // Additional incident fields
  resources?: number;
  size?: string | null;
  cfaId?: number;
  sesId?: number;
  estaId?: number;
  eventId?: string | number;
  suppress?: boolean;
  source?: string;
  url?: string;
}

// Feature interface
export interface EmergencyFeature {
  type: "Feature";
  geometry: {
    type: "GeometryCollection" | "Point" | "Polygon";
    geometries?: Array<{
      type: "Point" | "Polygon";
      coordinates: number[] | number[][] | number[][][];
    }>;
    coordinates?: number[] | number[][] | number[][][];
  };
  properties: EmergencyFeatureProperties;
}
