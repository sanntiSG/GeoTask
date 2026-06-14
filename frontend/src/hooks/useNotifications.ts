import { useCallback } from 'react';
import { notificationService } from '../services/notification.service.js';
import { useAppStore } from '../stores/app.store.js';
import { PermissionStatus } from '../types/index.js';

export function useNotifications() {
  const { permissions, setPermissions } = useAppStore();

  const requestAndSubscribe = useCallback(async (): Promise<boolean> => {
    const permResult = await notificationService.requestPermission();
    // Map the raw browser NotificationPermission to our internal PermissionStatus:
    // 'default' means the dialog was suppressed (quiet-messaging) → treat as 'prompt'.
    const storeStatus: PermissionStatus =
      permResult === 'default' ? 'prompt' : permResult;
    setPermissions({ notifications: storeStatus });

    if (permResult !== 'granted') return false;

    const result = await notificationService.subscribe();
    return result.ok;
  }, [setPermissions]);

  /**
   * Reconcile the store with the real browser permission value.
   * Call this on mount (Settings, App init) so stale localStorage values don't mislead the UI.
   */
  const checkNotificationPermission = useCallback(async () => {
    const status = await notificationService.checkPermission();
    const mapped = status === 'default' ? 'prompt' : (status as 'granted' | 'denied' | 'prompt');
    setPermissions({ notifications: mapped });
    return mapped;
  }, [setPermissions]);

  /**
   * When permission is already granted, guarantee a valid PushSubscription exists in the DB.
   * Safe to call repeatedly — subscribe() is idempotent (reuses existing browser subscription).
   * Returns { ok, reason } so callers can surface the error.
   */
  const ensureSubscribed = useCallback(async (): Promise<{ ok: boolean; reason?: string }> => {
    // First reconcile so we have the true browser state
    const realStatus = await checkNotificationPermission();
    if (realStatus !== 'granted') {
      return { ok: false, reason: 'permission-not-granted' };
    }
    return notificationService.subscribe();
  }, [checkNotificationPermission]);

  return {
    notificationPermission: permissions.notifications,
    requestAndSubscribe,
    checkNotificationPermission,
    ensureSubscribed,
  };
}
