/**
 * Capacitor config — referencia para naming conventions en la migración a nativo.
 * No usado en producción web. Documentado para el equipo cuando se escale a iOS/Android.
 *
 * Migración estratégica:
 * 1. Reemplazar geolocationService con @capacitor/geolocation
 * 2. Reemplazar notificationService con @capacitor/push-notifications
 * 3. Reemplazar storage.service con @capacitor/preferences
 * 4. Remover el Service Worker (web-push) — usar APNs/FCM nativos
 * 5. Reemplazar Leaflet con react-native-maps (si se va a React Native)
 *    o mantener WebView con Leaflet (si se queda en Capacitor)
 */

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  server?: {
    androidScheme?: string;
    hostname?: string;
  };
  plugins?: {
    PushNotifications?: {
      presentationOptions?: string[];
    };
    Geolocation?: {
      permissions?: {
        NSLocationAlwaysAndWhenInUseUsageDescription?: string;
        NSLocationWhenInUseUsageDescription?: string;
      };
    };
  };
}

const config: CapacitorConfig = {
  appId: 'com.geotask.app',
  appName: 'GeoTask',
  webDir: 'frontend/dist',
  server: {
    androidScheme: 'https',
    hostname: 'geotask.app',
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Geolocation: {
      permissions: {
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'GeoTask necesita tu ubicación para notificarte cuando llegás a tus lugares habituales.',
        NSLocationWhenInUseUsageDescription:
          'GeoTask usa tu ubicación para mostrar tareas cercanas.',
      },
    },
  },
};

export default config;
