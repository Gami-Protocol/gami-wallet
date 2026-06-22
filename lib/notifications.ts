import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { ReminderTime } from '@/lib/store/gameStore';

/**
 * Local notification helpers for GAMI's daily quest reminder.
 *
 * Reminders are scheduled entirely on-device with a repeating daily trigger;
 * no push token or backend is required.
 */

const REMINDER_TAG = 'gami.daily.reminder';

const COPY: { title: string; body: string }[] = [
  {
    title: 'NOVA needs you',
    body: 'Your streak is waiting — knock out a quest and stack some XP.',
  },
  { title: 'Daily drop', body: 'A fresh quest is live. Tap in before your streak resets.' },
  { title: "Don't break the chain", body: 'Two minutes today keeps your streak alive. Open GAMI.' },
];

function pickCopy(): { title: string; body: string } {
  return COPY[Math.floor(Math.random() * COPY.length)] ?? COPY[0];
}

/** Request OS permission to post notifications. Returns whether granted. */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain && current.status === Notifications.PermissionStatus.DENIED) {
    return false;
  }
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Cancel any previously scheduled daily reminder. */
export async function cancelDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.content.data?.tag === REMINDER_TAG)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/**
 * Sync the OS-scheduled daily reminder with the user's preference.
 * Pass 'off' to clear it. Returns false if permission was not granted.
 */
export async function syncDailyReminder(time: ReminderTime): Promise<boolean> {
  await cancelDailyReminder();
  if (time === 'off') return true;

  const granted = await ensureNotificationPermission();
  if (!granted) return false;

  const [hourStr, minStr] = time.split(':');
  const hour = Number(hourStr);
  const minute = Number(minStr);
  const copy = pickCopy();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: { tag: REMINDER_TAG },
      ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}
