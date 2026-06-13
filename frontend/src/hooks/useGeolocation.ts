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

    return () => {
      stopWatchRef.current?.();
    };
  }, [isAuthenticated, handlePosition]);
}

export function useCurrentPosition() {
  const getCurrentPosition = useCallback(() => geolocationService.getCurrentPosition(), []);
  return { getCurrentPosition };
}
