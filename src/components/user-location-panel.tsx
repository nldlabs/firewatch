import { useState } from "react";
import { Button } from "./ui/button";
import { formatDistance, type ProximityResult } from "../lib/geo-utils";

interface UserLocationPanelProps {
  coordinates: [number, number] | null;
  accuracy: number | null;
  loading: boolean;
  permissionDenied: boolean;
  nearestDanger: ProximityResult | null;
  totalWarnings: number;
  onRequestPermission: () => void;
}

/**
 * Format GPS accuracy into a human-readable string with quality indicator.
 */
function formatAccuracy(meters: number | null): { text: string; quality: 'high' | 'medium' | 'low' } {
  if (meters === null) return { text: 'Unknown', quality: 'low' };
  if (meters <= 10) return { text: `±${Math.round(meters)}m`, quality: 'high' };
  if (meters <= 50) return { text: `±${Math.round(meters)}m`, quality: 'medium' };
  return { text: `±${Math.round(meters)}m`, quality: 'low' };
}

/**
 * Get action recommendation based on warning proximity and type.
 */
function getActionRecommendation(nearestDanger: ProximityResult | null): {
  text: string;
  severity: 'critical' | 'warning' | 'caution' | 'safe';
} | null {
  if (!nearestDanger) return null;
  
  const action = nearestDanger.event.action?.toLowerCase() || '';
  
  if (nearestDanger.isInside) {
    if (action.includes('shelter')) {
      return { text: 'Shelter in place immediately', severity: 'critical' };
    }
    if (action.includes('leave')) {
      return { text: 'Leave the area now', severity: 'critical' };
    }
    return { text: 'Follow CFA instructions', severity: 'critical' };
  }
  
  if (nearestDanger.distance < 5) {
    return { text: 'Monitor conditions closely', severity: 'warning' };
  }
  
  if (nearestDanger.distance < 20) {
    return { text: 'Stay alert for updates', severity: 'caution' };
  }
  
  return null;
}

export function UserLocationPanel({
  coordinates,
  accuracy,
  loading,
  permissionDenied,
  nearestDanger,
  totalWarnings,
  onRequestPermission,
}: UserLocationPanelProps) {
  const [showCoords, setShowCoords] = useState(false);
  
  const accuracyInfo = formatAccuracy(accuracy);
  const recommendation = getActionRecommendation(nearestDanger);
  
  // Determine overall status
  const status = !coordinates
    ? 'disabled'
    : nearestDanger?.isInside
    ? 'critical'
    : nearestDanger && nearestDanger.distance < 5
    ? 'warning'
    : nearestDanger && nearestDanger.distance < 20
    ? 'caution'
    : 'safe';

  return (
    <div className={`bg-card/95 backdrop-blur-sm rounded-xl border shadow-lg transition-colors ${
      status === 'critical' ? 'border-red-500/50' :
      status === 'warning' ? 'border-amber-500/50' :
      'border-border'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-3 pb-2">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            status === 'critical' ? 'bg-red-500/20' :
            status === 'warning' ? 'bg-amber-500/20' :
            status === 'safe' ? 'bg-green-500/20' :
            'bg-muted'
          }`}>
            {loading ? (
              <span className="animate-spin text-sm">⟳</span>
            ) : coordinates ? (
              <span className="text-sm">📍</span>
            ) : (
              <span className="text-sm opacity-50">📍</span>
            )}
          </div>
          <div>
            <h3 className="text-[13px] font-semibold tracking-tight text-foreground leading-tight">
              Your Location
            </h3>
            {coordinates && (
              <button
                onClick={() => setShowCoords(!showCoords)}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCoords 
                  ? `${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)}`
                  : `GPS ${accuracyInfo.text}`
                }
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {coordinates ? (
            <>
              <span className={`flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded ${
                accuracyInfo.quality === 'high' ? 'text-green-500 bg-green-500/10' :
                accuracyInfo.quality === 'medium' ? 'text-amber-500 bg-amber-500/10' :
                'text-muted-foreground bg-muted'
              }`}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
                </span>
                Live
              </span>
            </>
          ) : permissionDenied ? (
            <Button 
              variant="secondary" 
              size="sm" 
              className="text-[11px] h-6 px-2" 
              onClick={onRequestPermission}
            >
              Enable
            </Button>
          ) : loading ? (
            <span className="text-[11px] text-muted-foreground animate-pulse">
              Locating...
            </span>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Unavailable
            </span>
          )}
        </div>
      </div>
      
      {/* Status Content */}
      {coordinates && (
        <div className="px-3 pb-3">
          {/* CRITICAL: Inside a warning zone */}
          {nearestDanger?.isInside ? (
            <div className="rounded-lg p-2.5 bg-red-500/15 border border-red-500/30">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[12px] font-semibold text-red-400">
                  ⚠️ Inside warning zone
                </span>
                {nearestDanger.event.action && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-red-500/20 text-red-400">
                    {nearestDanger.event.action}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {nearestDanger.event.name}
              </p>
              {recommendation && (
                <p className="text-[11px] font-medium mt-1.5 text-red-400">
                  → {recommendation.text}
                </p>
              )}
            </div>
          ) : nearestDanger && nearestDanger.distance < 5 ? (
            /* WARNING: Very close to a warning zone */
            <div className="rounded-lg p-2.5 bg-amber-500/15 border border-amber-500/30">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[12px] font-semibold text-amber-400">
                  ⚠️ Warning zone {formatDistance(nearestDanger.distance)} away
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {nearestDanger.event.name}
              </p>
              {recommendation && (
                <p className="text-[11px] font-medium mt-1.5 text-amber-400">
                  → {recommendation.text}
                </p>
              )}
            </div>
          ) : (
            /* SAFE: User is clear */
            <div className="rounded-lg p-2.5 bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-semibold text-green-500">
                  ✓ You're in a safe area
                </span>
              </div>
              {totalWarnings === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  No active fire warnings in Victoria
                </p>
              ) : nearestDanger ? (
                <p className="text-[11px] text-muted-foreground">
                  Nearest warning is {formatDistance(nearestDanger.distance)} away
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {totalWarnings} active warning{totalWarnings !== 1 ? 's' : ''} elsewhere
                </p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Permission denied help */}
      {!coordinates && permissionDenied && (
        <div className="px-3 pb-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Location access helps us alert you to nearby dangers. 
            Enable it in your browser settings.
          </p>
        </div>
      )}
    </div>
  );
}
