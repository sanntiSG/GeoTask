'use client';

import { useEffect, useRef } from 'react';
import { haversineMeters } from '@/lib/geo';
import type { Task } from '@/lib/types';

export function useProximityAlerts(tasks: Task[]) {
  const alertedRef = useRef<Set<number>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;

    async function requestNotificationPermission() {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    requestNotificationPermission();

    function onPosition(position: GeolocationPosition) {
      const userLoc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      for (const task of tasks) {
        if (task.completed) continue;
        const dist = haversineMeters(userLoc, task);
        if (dist <= task.radius) {
          if (!alertedRef.current.has(task.id)) {
            alertedRef.current.add(task.id);
            fireAlert(task, dist);
          }
        } else {
          alertedRef.current.delete(task.id);
        }
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, undefined, {
      enableHighAccuracy: true,
      maximumAge: 10000,
    });

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [tasks]);
}

function fireAlert(task: Task, distanceMeters: number) {
  const msg = `"${task.title}" is ${Math.round(distanceMeters)}m away.`;
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('GeoTask: nearby task', { body: msg, icon: '/favicon.ico' });
  } else {
    alert(`GeoTask nearby task:\n${msg}`);
  }
}
