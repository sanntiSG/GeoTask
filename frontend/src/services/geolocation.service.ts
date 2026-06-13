import { Coordinates } from '../types/index.js';

/**
 * Geolocation service — generic interface for web/native portability.
 * Swap implementation for @capacitor/geolocation in native builds.
 */
export interface GeolocationService {
  getCurrentPosition(): Promise<Coordinates>;
  watchPosition(callback: (coords: Coordinates) => void, onError?: (err: string) => void): () => void;
  checkPermission(): Promise<'granted' | 'denied' | 'prompt'>;
  requestPermission(): Promise<'granted' | 'denied'>;
}

const webGeolocationService: GeolocationService = {
  getCurrentPosition(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(new Error(err.message)),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
      );
    });
  },

  watchPosition(callback, onError): () => void {
    if (!navigator.geolocation) {
      onError?.('Geolocation not supported');
      return () => {};
    }
    const id = navigator.geolocation.watchPosition(
      (pos) => callback({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => onError?.(err.message),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  },

  async checkPermission(): Promise<'granted' | 'denied' | 'prompt'> {
    if (!navigator.permissions) return 'prompt';
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'prompt';
    }
  },

  async requestPermission(): Promise<'granted' | 'denied'> {
    try {
      await webGeolocationService.getCurrentPosition();
      return 'granted';
    } catch {
      return 'denied';
    }
  },
};

export const geolocationService = webGeolocationService;
