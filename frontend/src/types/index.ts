// =========================================
// GeoTask — Shared Types
// =========================================

export type TaskStatus = 'pending' | 'done' | 'discarded';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type UserRole = 'user' | 'admin';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserSettings {
  trackingStart: string;
  trackingEnd: string;
  defaultRadius: number;
  notificationInterval: number;
  renotifyAfter: number;
  renotifyEnabled: boolean;
}

export interface User {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  avatar: string;
  role: UserRole;
  lastPosition?: { lat: number; lng: number; updatedAt: string };
  settings: UserSettings;
  visitCounts: Record<string, number>;
  lastActive: string;
  createdAt: string;
}

export interface Location {
  _id: string;
  userId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  radius: number;
  visitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  userId: string;
  locationId: Location | string;
  title: string;
  emoji: string;
  color: string;
  priority: TaskPriority;
  status: TaskStatus;
  recurrence: {
    enabled: boolean;
    days: number[];
  };
  notifyAgainAfter: number;
  notifyAgainEnabled: boolean;
  lastNotified?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrajectoryPoint {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface Trajectory {
  _id: string;
  userId: string;
  date: string;
  points: TrajectoryPoint[];
  totalDistance: number;
  exported: boolean;
  createdAt: string;
}

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  totalLocations: number;
  active24h: number;
  active7d: number;
  active30d: number;
}

export interface AdminUser extends Pick<User, '_id' | 'name' | 'email' | 'avatar' | 'role' | 'lastActive' | 'createdAt'> {
  taskCount: number;
  locationCount: number;
}

export interface PhotonFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number];
  };
  properties: {
    name: string;
    country?: string;
    city?: string;
    state?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    osm_id?: number;
    osm_type?: string;
    type?: string;
  };
}

export interface PhotonResponse {
  type: 'FeatureCollection';
  features: PhotonFeature[];
}

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unsupported';

export interface AppPermissions {
  notifications: PermissionStatus;
  geolocation: PermissionStatus;
  installed: boolean;
}
