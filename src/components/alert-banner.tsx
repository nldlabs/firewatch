import type { EmergencyEvent } from "@shared/types/vic-emergency";
import type { Alert } from "../hooks/use-alerts";

interface AlertBannerProps {
  alerts: Alert[];
  fireEvents: EmergencyEvent[];
  onAlertClick: (event: EmergencyEvent) => void;
  onDismiss: (id: string) => void;
}

export function AlertBanner({ alerts, fireEvents, onAlertClick, onDismiss }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1001] max-w-lg w-full px-4">
      {alerts.slice(0, 3).map((alert) => {
        const linkedEvent = alert.eventId 
          ? fireEvents.find(e => e.id === alert.eventId)
          : undefined;
        
        return (
          <div
            key={alert.id}
            onClick={() => linkedEvent && onAlertClick(linkedEvent)}
            className={`mb-2 p-3 rounded-lg shadow-lg border backdrop-blur-md ${
              linkedEvent ? 'cursor-pointer hover:brightness-110 transition-all' : ''
            } ${
              alert.severity === 'critical' 
                ? 'bg-red-900/90 border-red-700/50 text-red-50' 
                : alert.severity === 'warning'
                ? 'bg-amber-900/90 border-amber-700/50 text-amber-50'
                : 'bg-card/90 border-border text-foreground'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-bold text-sm">{alert.title}</p>
                <p className="text-xs opacity-90">{alert.message}</p>
                {linkedEvent && (
                  <p className="text-xs opacity-70 mt-1">Click to view on map →</p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
                className="ml-2 opacity-70 hover:opacity-100 text-lg"
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
