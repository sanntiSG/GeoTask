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

    const subscribed = await notificationService.subscribe();
    return subscribed;
  }, [setPermissions]);

  const checkNotificationPermission = useCallback(async () => {
    const status = await notificationService.checkPermission();
    const mapped = status === 'default' ? 'prompt' : (status as 'granted' | 'denied' | 'prompt');
    setPermissions({ notifications: mapped });
    return mapped;
  }, [setPermissions]);

  return {
    notificationPermission: permissions.notifications,
    requestAndSubscribe,
    checkNotificationPermission,
  };
}
