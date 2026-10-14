import { getAnalytics, logScreenView } from '@react-native-firebase/analytics';
import { FIREBASE_ANALYTICS_ENABLED } from './config';
import { initRemoteConfig } from './remoteConfig';

let initialized = false;

// Initialize Firebase Remote Config; notification and attribution SDKs are not used.
export const initSdks = () => {
  if (initialized) return;
  initialized = true;
  initRemoteConfig();
};

export const trackScreen = (screenName) => {
  if (!FIREBASE_ANALYTICS_ENABLED || !screenName) return;
  logScreenView(getAnalytics(), { screen_name: screenName, screen_class: screenName }).catch(() => {});
};
