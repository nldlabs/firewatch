/**
 * Portfolio note: Geolocation is optional and local-only.
 * Tradeoffs:
 * - Convenience: We watch position in the browser for live proximity alerts.
 * - Privacy: Coordinates never leave the device; no storage or analytics.
 * - YAGNI: No server persistence or background sync; keep it simple.
 */
import { useState, useEffect, useCallback } from 'react';

export interface GeolocationState {
  coordinates: [number, number] | null; // [lng, lat]
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  supported: boolean;
  permissionDenied: boolean;
}

export interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    watchPosition = true,
    timeout = 10000,
    maximumAge = 30000,
  } = options;

  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const [state, setState] = useState<GeolocationState>(() => ({
    coordinates: null,
    accuracy: null,
    error: isSupported ? null : 'Geolocation not supported',
    loading: isSupported, // Only loading if we're actually going to try
    supported: isSupported,
    permissionDenied: false,
  }));

  const handleSuccess = useCallback((position: GeolocationPosition) => {
    setState(prev => ({
      ...prev,
      coordinates: [position.coords.longitude, position.coords.latitude],
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
      permissionDenied: false,
    }));
  }, []);

  const handleError = useCallback((error: GeolocationPositionError) => {
    setState(prev => ({
      ...prev,
      error: error.message,
      loading: false,
      permissionDenied: error.code === error.PERMISSION_DENIED,
    }));
  }, []);

  const requestPermission = useCallback(() => {
    if (!isSupported) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge,
    });
  }, [isSupported, handleSuccess, handleError, enableHighAccuracy, timeout, maximumAge]);

  useEffect(() => {
    if (!isSupported) return;

    const geoOptions = { enableHighAccuracy, timeout, maximumAge };

    if (watchPosition) {
      // watchPosition fires immediately, no need for getCurrentPosition first
      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      // One-time position fetch
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);
    }
  }, [watchPosition, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError, isSupported]);

  return {
    ...state,
    requestPermission,
  };
}
