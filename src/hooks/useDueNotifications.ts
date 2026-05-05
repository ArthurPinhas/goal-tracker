import { useEffect, useRef, useState } from 'react';
import type { Goal } from '@/types/goal';
import {
  DUE_NOTIFICATION_INTERVAL_MS,
  isDueNotificationsEnabled,
  runDueNotificationCheck,
  setDueNotificationsEnabled,
  getBrowserNotificationSupport,
  requestDueNotificationPermission,
  type DueReminderDeliveredPayload,
} from '@/lib/dueNotifications';

export { DUE_NOTIFICATION_INTERVAL_MS } from '@/lib/dueNotifications';

export type UseDueNotificationsOptions = {
  /** Shown in the page (e.g. toast) when a reminder fires — visible in whichever browser tab is open. */
  onDelivered?: (p: DueReminderDeliveredPayload) => void;
};

export function useDueNotifications(goals: Goal[], options: UseDueNotificationsOptions = {}) {
  const goalsRef = useRef(goals);
  goalsRef.current = goals;

  const onDeliveredRef = useRef(options.onDelivered);
  onDeliveredRef.current = options.onDelivered;

  const [enabled, setEnabled] = useState(() => isDueNotificationsEnabled());
  const permission = getBrowserNotificationSupport();

  useEffect(() => {
    if (!enabled) return;
    /* Include `goals` in deps so we run after load/update — otherwise the first tick can see an empty list and wait for the next interval. */

    const tick = () =>
      runDueNotificationCheck(goalsRef.current, (p) => onDeliveredRef.current?.(p));
    tick();
    const id = window.setInterval(tick, DUE_NOTIFICATION_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === 'visible') tick();
    };
    const onWinFocus = () => tick();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onWinFocus);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('focus', onWinFocus);
    };
  }, [enabled, goals]);

  const turnOn = async (): Promise<'ok' | 'denied' | 'unsupported'> => {
    const sup = getBrowserNotificationSupport();
    if (sup === 'unsupported') return 'unsupported';
    let p = sup;
    if (p === 'default') {
      p = await requestDueNotificationPermission();
    }
    if (p !== 'granted') {
      setDueNotificationsEnabled(false);
      setEnabled(false);
      return 'denied';
    }
    setDueNotificationsEnabled(true);
    setEnabled(true);
    runDueNotificationCheck(goalsRef.current, (p) => onDeliveredRef.current?.(p));
    return 'ok';
  };

  const turnOff = () => {
    setDueNotificationsEnabled(false);
    setEnabled(false);
  };

  return {
    notificationsEnabled: enabled,
    notificationPermission: permission,
    setDueNotificationsOn: turnOn,
    setDueNotificationsOff: turnOff,
  };
}
