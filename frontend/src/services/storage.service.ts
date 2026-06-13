/**
 * Storage service — abstraction over localStorage for native portability.
 * In React Native, swap localStorage calls for AsyncStorage.
 */
export interface StorageService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

const webStorageService: StorageService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota exceeded — non-critical
    }
  },
  remove(key: string): void {
    localStorage.removeItem(key);
  },
  clear(): void {
    localStorage.clear();
  },
};

export const storage = webStorageService;

export const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'geotask:onboarding',
  PERMISSIONS: 'geotask:permissions',
  LAST_SUGGESTION_DATE: 'geotask:suggestions:date',
} as const;
