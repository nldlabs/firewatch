/**
 * Portfolio note: Client-only map rendering with Leaflet.
 * Tradeoffs:
 * - YAGNI: No clustering or virtualization; simple for a small dataset.
 * - Performance: Fine for portfolio scale; consider clustering if events grow.
 * - Accessibility: Basic popups; further ARIA improvements could be added later.
 */
import { MapContainer, TileLayer, CircleMarker, Marker, Polygon, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { EmergencyEvent } from '@shared/types/vic-emergency';
import { useEffect } from 'react';
import { getActionPriority, getActionColor, formatTimeAgo } from '../lib/utils';
import 'leaflet/dist/leaflet.css';

// Create icon for critical markers
function createActionIcon(priority: number, color: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 40 : 32;
  const borderWidth = isSelected ? 3 : 2;
  const iconSize = Math.round(size * 0.55);
  
  // Animation class based on priority
  const animClass = priority >= 3 ? 'marker-critical' : (priority >= 2 ? 'marker-urgent' : '');
  
  let iconSvg = '';
  
  if (priority >= 3) {
    // Shelter In Place - Shield with X (stay protected, don't move)
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9.5 9l5 5"/>
      <path d="M14.5 9l-5 5"/>
    </svg>`;
  } else if (priority >= 2) {
    // Leave Immediately - Double chevron right (urgent exit)
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="7 17 12 12 7 7"/>
      <polyline points="13 17 18 12 13 7"/>
    </svg>`;
  } else if (priority >= 1) {
    // Leave - Single chevron right (exit)
    iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>`;
  }
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="relative flex items-center justify-center" style="width: ${size}px; height: ${size}px;">
        <div class="absolute inset-0 rounded-full ${animClass}" style="background-color: ${color}; border: ${borderWidth}px solid ${isSelected ? 'white' : color};"></div>
        <div class="relative z-10 flex items-center justify-center" style="width: 100%; height: 100%;">
          ${iconSvg}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Victoria center coordinates
const VICTORIA_CENTER: [number, number] = [-37.0, 144.5];
const DEFAULT_ZOOM = 8; // Slightly more zoomed in for better detail

function getSeverityRadius(severity?: string, status?: string): number {
  if (status === 'Extreme' || severity === 'Extreme') return 12;
  if (severity === 'Moderate') return 10;
  return 8;
}

// Shared popup content for events
function EventPopupContent({ event }: { event: EmergencyEvent }) {
  const priority = getActionPriority(event.action);
  const isCritical = priority >= 3;
  const isUrgent = priority >= 2;
  const isIncident = event.feedType && event.feedType !== 'warning';
  
  // Parse sizeFmt - can be string or array
  const sizeInfo = Array.isArray(event.sizeFmt) 
    ? event.sizeFmt.join(', ') 
    : event.sizeFmt;
    
  return (
    <div className="min-w-[250px] max-w-[350px] p-1">
      {/* Action Banner */}
      {isCritical && (
        <div className="bg-red-700 text-red-50 font-semibold px-2 py-1.5 rounded mb-2 text-center text-sm tracking-wide">
          Shelter In Place
        </div>
      )}
      {isUrgent && !isCritical && (
        <div className="bg-amber-700 text-amber-50 font-semibold px-2 py-1.5 rounded mb-2 text-center text-sm tracking-wide">
          Leave Immediately
        </div>
      )}
      {!isCritical && !isUrgent && priority >= 1 && (
        <div className="bg-amber-600 text-amber-50 font-semibold px-2 py-1.5 rounded mb-2 text-center text-sm tracking-wide">
          Leave Now
        </div>
      )}
      {isIncident && (
        <div className="bg-gray-500 text-white text-xs font-medium px-2 py-0.5 rounded mb-2 inline-block">
          Incident
        </div>
      )}
      
      {/* Title & Location */}
      <h3 className="font-bold text-gray-900 text-base mb-1">{event.name}</h3>
      <p className="text-sm text-gray-700 mb-2">{event.location}</p>
      
      {/* Key Stats Grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
        {event.status && (
          <>
            <span className="text-gray-500">Status:</span>
            <span className="font-medium text-gray-800">{event.status}</span>
          </>
        )}
        {event.cap?.severity && (
          <>
            <span className="text-gray-500">Severity:</span>
            <span className={`font-medium ${
              event.cap.severity === 'Extreme' ? 'text-red-600' :
              event.cap.severity === 'Moderate' ? 'text-orange-600' : 'text-yellow-600'
            }`}>{event.cap.severity}</span>
          </>
        )}
        {event.cap?.urgency && (
          <>
            <span className="text-gray-500">Urgency:</span>
            <span className="font-medium text-gray-800">{event.cap.urgency}</span>
          </>
        )}
        {sizeInfo && (
          <>
            <span className="text-gray-500">Size:</span>
            <span className="font-medium text-gray-800">{sizeInfo}</span>
          </>
        )}
        {event.resources && event.resources > 0 && (
          <>
            <span className="text-gray-500">Resources:</span>
            <span className="font-medium text-gray-800">{event.resources}</span>
          </>
        )}
        {event.category2 && (
          <>
            <span className="text-gray-500">Type:</span>
            <span className="font-medium text-gray-800">{event.category2}</span>
          </>
        )}
      </div>
      
      {/* Web Body / Description */}
      {event.webBody && (
        // Portfolio tradeoff: rendering trusted HTML from VIC Emergency.
        // YAGNI: Skip full sanitization here; consider DOMPurify if needed.
        <div 
          className="text-xs text-gray-700 mb-2 border-l-2 border-gray-300 pl-2 max-h-48 overflow-y-auto [&_a]:text-blue-600 [&_a]:underline [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-4"
          dangerouslySetInnerHTML={{ __html: event.webBody }}
        />
      )}
      
      {/* Web Headline */}
      {event.webHeadline && !event.webBody && (
        <p className="text-xs text-gray-700 mb-2 italic">{event.webHeadline}</p>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
        <span>{event.cap?.senderName || event.sourceOrg}</span>
        <span title={event.updated}>Updated {formatTimeAgo(event.updated)}</span>
      </div>
    </div>
  );
}

// Component to fly to a location when selectedEvent changes
function FlyToEvent({ event }: { event: EmergencyEvent | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (event?.coordinates) {
      // Leaflet uses [lat, lng], our coords are [lng, lat]
      map.flyTo([event.coordinates[1], event.coordinates[0]], 10, {
        duration: 0.8
      });
    }
  }, [event, map]);
  
  return null;
}

// Create user location marker - cached since it never changes
const USER_LOCATION_ICON = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div class="relative" style="width: 24px; height: 24px;">
      <div class="absolute inset-0 rounded-full bg-blue-500 opacity-30 animate-ping"></div>
      <div class="absolute inset-1 rounded-full bg-blue-500 border-2 border-white shadow-lg"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Polygon for warnings with smooth styling
function WarningPolygon({ event, isSelected, onSelect }: { 
  event: EmergencyEvent; 
  isSelected: boolean;
  onSelect: () => void;
}) {
  const priority = getActionPriority(event.action);
  const isCritical = priority >= 3; // Shelter In Place
  const isUrgent = priority >= 2; // Leave Immediately
  const isIncident = event.feedType && event.feedType !== 'warning';
  
  if (!event.polygon) return null;
  
  const positions: [number, number][] = event.polygon.map(coord => [coord[1], coord[0]]);
  const baseColor = getActionColor(event.action, event.cap?.severity, event.status, event.feedType);
  
  // Clean, static styling
  const fillOpacity = isIncident ? 0.06 : (isCritical ? 0.2 : (isUrgent ? 0.15 : 0.1));
  const strokeWeight = isSelected ? 2.5 : (isCritical ? 1.5 : 1);
  const dashPattern = isIncident ? '4, 8' : (isCritical ? undefined : (isUrgent ? '5, 5' : '2, 4'));
  const strokeOpacity = isIncident ? 0.4 : (isSelected ? 1 : 0.8);
  
  return (
    <Polygon
      positions={positions}
      pathOptions={{
        color: isSelected ? '#fff' : baseColor,
        fillColor: baseColor,
        fillOpacity,
        weight: strokeWeight,
        dashArray: dashPattern,
        opacity: strokeOpacity,
        className: isCritical ? 'polygon-critical' : undefined,
      }}
      eventHandlers={{ click: onSelect }}
    >
      <Popup>
        <EventPopupContent event={event} />
      </Popup>
    </Polygon>
  );
}

interface EmergencyMapProps {
  events: EmergencyEvent[];
  selectedEvent: EmergencyEvent | null;
  onEventSelect: (event: EmergencyEvent) => void;
  userLocation?: [number, number] | null;
}

export function EmergencyMap({ 
  events, 
  selectedEvent, 
  onEventSelect,
  userLocation,
}: EmergencyMapProps) {
  // Filter to only events with coordinates
  const mappableEvents = events.filter(e => e.coordinates !== null);
  // Sort so critical events render on top (higher z-index)
  const sortedEvents = [...mappableEvents].sort((a, b) => 
    getActionPriority(a.action) - getActionPriority(b.action)
  );
  
  return (
    <MapContainer
      center={VICTORIA_CENTER}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full rounded-lg"
      style={{ background: '#1a1a2e' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      
      <FlyToEvent event={selectedEvent} />
      
      {/* Render polygons first (below markers) */}
      {sortedEvents.map((event) => (
        <WarningPolygon
          key={`poly-${event.id}-${event.sourceId}`}
          event={event}
          isSelected={selectedEvent?.id === event.id}
          onSelect={() => onEventSelect(event)}
        />
      ))}
      
      {/* Render center markers on top */}
      {sortedEvents.map((event) => {
        const color = getActionColor(event.action, event.cap?.severity, event.status, event.feedType);
        const radius = getSeverityRadius(event.cap?.severity, event.status);
        const isSelected = selectedEvent?.id === event.id;
        const priority = getActionPriority(event.action);
        const hasAction = priority >= 1;
        const isIncident = event.feedType && event.feedType !== 'warning';
        
        const position: [number, number] = [event.coordinates![1], event.coordinates![0]];
        
        // Use custom icon marker for action events, CircleMarker for others
        if (hasAction) {
          const icon = createActionIcon(priority, color, isSelected);
          
          return (
            <Marker
              key={`marker-${event.id}-${event.sourceId}`}
              position={position}
              icon={icon}
              eventHandlers={{
                click: () => onEventSelect(event)
              }}
            >
              <Popup>
                <EventPopupContent event={event} />
              </Popup>
            </Marker>
          );
        }
        
        // For incidents (non-warnings), use smaller, more subdued markers
        const incidentRadius = isIncident ? Math.max(radius - 2, 5) : radius;
        const markerOpacity = isIncident ? 0.6 : 0.9;
        
        return (
          <CircleMarker
            key={`marker-${event.id}-${event.sourceId}`}
            center={position}
            radius={isSelected ? incidentRadius + 4 : incidentRadius}
            pathOptions={{
              color: isSelected ? '#fff' : color,
              fillColor: color,
              fillOpacity: markerOpacity,
              weight: isSelected ? 3 : (isIncident ? 1 : 2),
            }}
            eventHandlers={{
              click: () => onEventSelect(event)
            }}
          >
            <Popup>
              <EventPopupContent event={event} />
            </Popup>
          </CircleMarker>
        );
      })}
      
      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation[1], userLocation[0]]}
          icon={USER_LOCATION_ICON}
          zIndexOffset={1000}
        >
          <Popup>
            <div className="text-center p-1">
              <p className="font-bold text-blue-600">Your Location</p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
