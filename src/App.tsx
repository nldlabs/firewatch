import { ThemeProvider } from "./components/theme-provider";
import type { EmergencyEvent } from "@shared/types/vic-emergency";
import { useState, useMemo } from "react";
import { EmergencyMap } from "./components/emergency-map";
import { calculateFireWarningAreas, getNearestDanger } from "./lib/geo-utils";
import { useGeolocation } from "./hooks/use-geolocation";
import { useAlerts } from "./hooks/use-alerts";
import { useFireEvents } from "./hooks/use-fire-events";
import { DisclaimerDialog } from "./components/disclaimer-dialog";
import { AlertBanner } from "./components/alert-banner";
import { UserLocationPanel } from "./components/user-location-panel";
import { StatusPanel } from "./components/status-panel";
import { MapLegend } from "./components/map-legend";

function App() {
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Data fetching
  const { 
    fireEvents, 
    fireWarnings, 
    loading, 
    error, 
    lastUpdated,
    totalWarnings,
    totalIncidents,
  } = useFireEvents();

  // Geolocation
  const geo = useGeolocation();

  // Alerts system - only for warnings
  const alerts = useAlerts(geo.coordinates, fireWarnings);

  // Derived state
  const areaStats = useMemo(() => 
    calculateFireWarningAreas(fireWarnings), 
    [fireWarnings]
  );

  const userNearestDanger = useMemo(() => {
    if (!geo.coordinates) return null;
    return getNearestDanger(geo.coordinates, fireWarnings);
  }, [geo.coordinates, fireWarnings]);

  // Loading state
  if (loading) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading emergency data...</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <div className="flex min-h-svh items-center justify-center bg-background">
          <div className="text-center text-red-500">
            <p className="text-xl font-bold mb-2">⚠️ Error</p>
            <p>{error}</p>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DisclaimerDialog open={showDisclaimer} onAccept={() => setShowDisclaimer(false)} />
      
      <div className="h-svh bg-background overflow-hidden relative">
        {/* Full-screen Map */}
        <EmergencyMap
          events={fireEvents}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
          userLocation={geo.coordinates}
        />
        
        {/* Alert Banner - Top */}
        <AlertBanner
          alerts={alerts.undismissedAlerts}
          fireEvents={fireEvents}
          onAlertClick={setSelectedEvent}
          onDismiss={alerts.dismissAlert}
        />
        
        {/* Control Panels - Top Right */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 max-w-[280px]">
          <UserLocationPanel
            coordinates={geo.coordinates}
            accuracy={geo.accuracy}
            loading={geo.loading}
            permissionDenied={geo.permissionDenied}
            nearestDanger={userNearestDanger}
            totalWarnings={totalWarnings}
            onRequestPermission={geo.requestPermission}
          />
          
        </div>
        
        {/* Status Panel - Bottom Right */}
        <StatusPanel
          totalWarnings={totalWarnings}
          totalIncidents={totalIncidents}
          areaStats={areaStats}
          lastUpdated={lastUpdated}
        />
        
      </div>
    </ThemeProvider>
  );
}

export default App;
