import {
  getRemoteConfig,
  setDefaults,
  setConfigSettings,
  fetchAndActivate,
  getValue,
} from '@react-native-firebase/remote-config';

import { FIREBASE_REMOTE_CONFIG_ENABLED } from './config';

// Keys to create in Firebase Console → Remote Config
export const RC_KEYS = {
  WEBVIEW_ENABLED: 'cedar_gate_n7p2',
  WEBVIEW_URL: 'opal_route_v4k9',
};

// Used until the first successful fetch (and when offline)
const DEFAULTS = {
  [RC_KEYS.WEBVIEW_ENABLED]: false,
  [RC_KEYS.WEBVIEW_URL]: '',
};

let initialization;

export const initRemoteConfig = () => {
  if (!FIREBASE_REMOTE_CONFIG_ENABLED) return Promise.resolve(false);
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      const rc = getRemoteConfig();
      await setConfigSettings(rc, {
        minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000,
        fetchTimeoutMillis: 8000,
      });
      await setDefaults(rc, DEFAULTS);
      await fetchAndActivate(rc);
      return true;
    } catch (e) {
      console.log('Remote Config init error:', e?.message);
      return false;
    }
  })();
  return initialization;
};

export const isValidWebUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !!url.hostname && !url.username && !url.password;
  } catch {
    return false;
  }
};

export const fetchPreviewEntryUrl = async () => {
  if (!(await initRemoteConfig())) return null;
  try {
    const rc = getRemoteConfig();
    const enabled = getValue(rc, RC_KEYS.WEBVIEW_ENABLED);
    const value = getValue(rc, RC_KEYS.WEBVIEW_URL);
    const url = value.asString().trim();
    if (enabled.getSource() !== 'remote' || value.getSource() !== 'remote' || !enabled.asBoolean()) return null;
    return isValidWebUrl(url) ? url : null;
  } catch (e) {
    console.log('Preview Remote Config unavailable:', e?.message);
    return null;
  }
};
