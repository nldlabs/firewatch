import { useState } from "react";
import { Badge } from "./ui/badge";
import { formatArea, formatPercent } from "../lib/geo-utils";

interface AreaStats {
  shelterAreaKm2: number;
  shelterPercent: number;
  leaveImmediatelyAreaKm2: number;
  leaveImmediatelyPercent: number;
  leaveAreaKm2: number;
  leavePercent: number;
  totalWarningAreaKm2: number;
  totalPercent: number;
}

interface StatusPanelProps {
  totalWarnings: number;
  totalIncidents: number;
  areaStats: AreaStats;
  lastUpdated: Date | null;
}

export function StatusPanel({
  totalWarnings,
  totalIncidents,
  areaStats,
  lastUpdated,
}: StatusPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Compact mobile view (collapsed)
  const compactView = (
    <button
      onClick={() => setIsExpanded(true)}
      className="md:hidden bg-card/95 backdrop-blur-sm rounded-xl border border-border px-4 py-3 shadow-lg flex items-center gap-3"
    >
      <div className="flex items-center gap-2">
        {totalWarnings > 0 && (
          <Badge variant="secondary" className="text-xs font-medium px-2.5 py-1 bg-orange-600/20 text-orange-500 border-orange-500/30">
            {totalWarnings} Warning{totalWarnings !== 1 ? 's' : ''}
          </Badge>
        )}
        {totalIncidents > 0 && (
          <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 text-yellow-500/70 border-yellow-500/30">
            {totalIncidents} Incident{totalIncidents !== 1 ? 's' : ''}
          </Badge>
        )}
        {totalWarnings === 0 && totalIncidents === 0 && (
          <Badge variant="outline" className="text-xs font-medium px-2.5 py-1 text-green-500 border-green-500">
            All Clear
          </Badge>
        )}
      </div>
      <span className="text-xs text-muted-foreground">▲</span>
    </button>
  );

  // Full expanded view
  const expandedView = (
    <div className="bg-card/95 backdrop-blur-sm rounded-xl border border-border p-4 shadow-xl min-w-[300px]">
      {/* Mobile close button */}
      <button
        onClick={() => setIsExpanded(false)}
        className="md:hidden absolute top-2 right-2 text-muted-foreground hover:text-foreground p-1"
      >
        ×
      </button>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1.5 ml-2">
          {totalWarnings > 0 && (
            <Badge variant="secondary" className="text-[11px] font-medium px-2 py-0.5 bg-orange-600/20 text-orange-500 border-orange-500/30">
              {totalWarnings} Warning{totalWarnings !== 1 ? 's' : ''}
            </Badge>
          )}
          {totalIncidents > 0 && (
            <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 text-yellow-500/70 border-yellow-500/30">
              {totalIncidents} Incident{totalIncidents !== 1 ? 's' : ''}
            </Badge>
          )}
          {totalWarnings === 0 && totalIncidents === 0 && (
            <Badge variant="outline" className="text-[11px] font-medium px-2 py-0.5 text-green-500 border-green-500">
              All Clear
            </Badge>
          )}
        </div>
      </div>
      
      {/* Area Stats */}
      {totalWarnings > 0 && (
        <div className="space-y-2.5 mb-4">
          {areaStats.shelterAreaKm2 > 0 && (
            <div className="border border-red-500/20 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" style={{animationDuration: '1.5s'}} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium leading-tight">Shelter In Place</p>
                    <p className="text-[11px] text-red-400/60 mt-0.5">{formatPercent(areaStats.shelterPercent)} of Victoria</p>
                  </div>
                </div>
                <span className="text-xl font-semibold tracking-tight tabular-nums">{formatArea(areaStats.shelterAreaKm2)}</span>
              </div>
            </div>
          )}
          {areaStats.leaveImmediatelyAreaKm2 > 0 && (
            <div className="border border-amber-500/20 rounded-lg p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2 w-2 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" style={{animationDuration: '2s'}} />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium leading-tight">Leave Immediately</p>
                    <p className="text-[11px] text-amber-400/60 mt-0.5">{formatPercent(areaStats.leaveImmediatelyPercent)} of Victoria</p>
                  </div>
                </div>
                <span className="text-xl font-semibold tracking-tight tabular-nums">{formatArea(areaStats.leaveImmediatelyAreaKm2)}</span>
              </div>
            </div>
          )}
          {areaStats.leaveAreaKm2 > 0 && (
            <div className="flex items-center justify-between py-1 px-1">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[13px] text-muted-foreground">Leave Now</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold tabular-nums">{formatArea(areaStats.leaveAreaKm2)}</span>
                <span className="text-[11px] text-muted-foreground">({formatPercent(areaStats.leavePercent)})</span>
              </div>
            </div>
          )}
          <div className="border-t border-border/50 pt-3 mt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] text-muted-foreground">Total Warning Area</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-semibold text-foreground tabular-nums">{formatArea(areaStats.totalWarningAreaKm2)}</span>
                <span className="text-[11px] text-muted-foreground">({formatPercent(areaStats.totalPercent)})</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {lastUpdated && (
        <p className="text-[11px] text-muted-foreground/70 border-t border-border/50 pt-3">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );

  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      {/* Show compact on mobile when collapsed, expanded view when expanded or on desktop */}
      <div className={isExpanded ? 'hidden' : 'block md:hidden'}>
        {compactView}
      </div>
      <div className={isExpanded ? 'block relative' : 'hidden md:block'}>
        {expandedView}
      </div>
    </div>
  );
}
