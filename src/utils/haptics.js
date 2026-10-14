import * as Haptics from 'expo-haptics';

// Toggled from settings (AppProvider keeps it in sync)
let enabled = true;
export const setHapticsEnabled = (value) => {
  enabled = value !== false;
};

const run = (fn) => {
  if (!enabled) return;
  fn().catch(() => {});
};

export const hapticSelect = () => run(() => Haptics.selectionAsync());
export const hapticTap = () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
export const hapticSuccess = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
export const hapticWarning = () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
