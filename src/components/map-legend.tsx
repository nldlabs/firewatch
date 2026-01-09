export function MapLegend() {
  return (
    <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border z-[1000] shadow-lg">
      <p className="text-xs font-semibold mb-2 text-muted-foreground">Warning Level</p>
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" style={{animationDuration: '1.5s'}} />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <span className="font-medium">Shelter In Place</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" style={{animationDuration: '2s'}} />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600" />
          </span>
          <span className="font-medium">Leave Immediately</span>
        </div>
        <div className="border-t border-border my-1.5" />
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="text-muted-foreground">Extreme</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-orange-500/80" />
          <span className="text-muted-foreground">Moderate</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="text-muted-foreground">Minor</span>
        </div>
      </div>
    </div>
  );
}
