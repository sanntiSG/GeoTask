import { useEffect, useRef, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { geolocationService } from '../services/geolocation.service.js';
import { useAuth } from './useAuth.js';
import api from '../services/api.service.js';
import { Coordinates } from '../types/index.js';

const SYNC_INTERVAL_MS = 60 * 1000;

export function useGeolocationSync() {
  const { isAuthenticated } = useAuth();
  const stopWatchRef = useRef<(() => void) | null>(null);
  const lastSyncRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const syncPosition = useMutation({
    mutationFn: (coords: Coordinates) => api.post('/position', coords),
  });

  const handlePosition = useCallback(
    (coords: Coordinates) => {
      const now = Date.now();
      if (now - lastSyncRef.current < SYNC_INTERVAL_MS) return;
      lastSyncRef.current = now;
      syncPosition.mutate(coords);
    },
    [syncPosition],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    stopWatchRef.current = geolocationService.watchPosition(handlePosition);

    // watchPosition fires infrequently when the device is stationary, which means
    // lastPosition.updatedAt goes stale and the cron stops evaluating the user.
    // Poll getCurrentPosition every SYNC_INTERVAL_MS as a guaranteed heartbeat so
    // a stationary user's position stays within the 5-min cron window.
    intervalRef.current = setInterval(() => {
      geolocationService
        .getCurrentPosition()
        .then((coords) => handlePosition(coords))
        .catch(() => {});
    }, SYNC_INTERVAL_MS);

    return () => {
      stopWatchRef.current?.();
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, handlePosition]);
}

export function useCurrentPosition() {
  const getCurrentPosition = useCallback(() => geolocationService.getCurrentPosition(), []);
  return { getCurrentPosition };
}
