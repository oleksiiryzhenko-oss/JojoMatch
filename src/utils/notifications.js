import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import colors from './colors';
import { WEEKDAYS_LONG } from './helpers';

const REMINDER_CHANNEL = 'workout-reminders';
const REST_CHANNEL = 'rest-timer';
const KIND_REMINDER = 'weekly-reminder';
const KIND_REST = 'rest-end';

// Rest-end alerts only matter when the app is in the background; in the foreground the timer UI + haptics cover it
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isRest = notification.request.content.data?.kind === KIND_REST;
    return {
      shouldShowBanner: !isRest,
      shouldShowList: true,
      shouldPlaySound: !isRest,
      shouldSetBadge: false,
    };
  },
});

let channelsReady = null;
const ensureChannels = () => {
  if (Platform.OS !== 'android') return Promise.resolve();
  if (!channelsReady) {
    channelsReady = Promise.all([
      Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
        name: 'Antrenman hatırlatıcıları',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 200, 250],
        lightColor: colors.primary,
      }),
      Notifications.setNotificationChannelAsync(REST_CHANNEL, {
        name: 'Dinlenme sayacı',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 400, 150, 400],
        lightColor: colors.primary,
      }),
    ]).catch((e) => {
      channelsReady = null;
      console.log('Notification channel error:', e);
    });
  }
  return channelsReady;
};

// 'granted' | 'denied' | 'blocked' (denied and the system won't ask again)
export const requestNotificationPermission = async () => {
  try {
    await ensureChannels();
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return 'granted';
    if (!current.canAskAgain) return 'blocked';
    const res = await Notifications.requestPermissionsAsync();
    if (res.granted) return 'granted';
    return res.canAskAgain ? 'denied' : 'blocked';
  } catch (e) {
    console.log('Notification permission error:', e);
    return 'denied';
  }
};

const hasPermission = async () => {
  try {
    return (await Notifications.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
};

const cancelByKind = async (kind) => {
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => n.content.data?.kind === kind)
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
};

// Re-creates one weekly notification per weekday that has a reminder time
export const syncWeeklyReminders = async ({ enabled, weekPlan, templatesById }) => {
  try {
    await cancelByKind(KIND_REMINDER);
    if (!enabled || !(await hasPermission())) return;
    await ensureChannels();

    const jobs = Object.entries(weekPlan?.days || {}).map(([dow, day]) => {
      if (!day?.reminder || day.rest) return null;
      const [hour, minute] = day.reminder.split(':').map(Number);
      const names = (day.templateIds || []).map((id) => templatesById[id]?.name).filter(Boolean);
      return Notifications.scheduleNotificationAsync({
        content: {
          title: 'Antrenman zamanı 💪',
          body: names.length
            ? `${WEEKDAYS_LONG[dow]} planın: ${names.join(', ')}`
            : 'Bugünkü antrenmanını unutma. Planına göz at!',
          data: { kind: KIND_REMINDER, weekday: Number(dow) },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: Number(dow) + 1, // expo: 1 = Sunday, JS getDay(): 0 = Sunday
          hour,
          minute,
          channelId: REMINDER_CHANNEL,
        },
      });
    });
    await Promise.all(jobs.filter(Boolean));
  } catch (e) {
    console.log('Reminder sync error:', e);
  }
};

// One pending "rest is over" alert at a time
export const scheduleRestEnd = async (endsAtIso, exerciseName) => {
  try {
    await cancelByKind(KIND_REST);
    if (!endsAtIso || !(await hasPermission())) return;
    const date = new Date(endsAtIso);
    if (date.getTime() <= Date.now() + 1000) return;
    await ensureChannels();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Dinlenme bitti ⏱️',
        body: exerciseName ? `Sıradaki set: ${exerciseName}` : 'Sıradaki sete geç!',
        data: { kind: KIND_REST },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: REST_CHANNEL },
    });
  } catch (e) {
    console.log('Rest notification error:', e);
  }
};

export const cancelRestEnd = () => cancelByKind(KIND_REST).catch(() => {});
