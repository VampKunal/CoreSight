import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

const DEFAULT_API_PORT = '5000';
const DEFAULT_POSTURE_PORT = '8000';

const getExtra = () => Constants.expoConfig?.extra ?? {};

const normalizeBaseUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
};

const extractHostFromScriptUrl = () => {
  const scriptURL = NativeModules?.SourceCode?.scriptURL;

  if (!scriptURL) {
    return '';
  }

  const match = scriptURL.match(/^[a-z]+:\/\/([^/:]+)/i);
  return match?.[1] ?? '';
};

const getHost = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname || 'localhost';
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return hostUri.split(':')[0];
  }

  const scriptHost = extractHostFromScriptUrl();
  if (scriptHost && scriptHost !== 'localhost') {
    return scriptHost;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
};

const buildHttpUrl = (port, override) => {
  const normalizedOverride = normalizeBaseUrl(override);

  if (normalizedOverride) {
    return normalizedOverride;
  }

  return `http://${getHost()}:${port}`;
};

const buildWsUrl = (port, override) => {
  const normalizedOverride = normalizeBaseUrl(override);

  if (normalizedOverride) {
    return normalizedOverride.replace(/^http/i, 'ws');
  }

  return `ws://${getHost()}:${port}`;
};

export const getApiBaseUrl = () => {
  const extra = getExtra();
  return buildHttpUrl(extra.apiServicePort || DEFAULT_API_PORT, extra.apiBaseUrl);
};

export const getPostureBaseUrl = () => {
  const extra = getExtra();
  return buildHttpUrl(extra.postureServicePort || DEFAULT_POSTURE_PORT, extra.postureBaseUrl);
};

export const getPostureWsBaseUrl = () => {
  const extra = getExtra();
  return buildWsUrl(extra.postureServicePort || DEFAULT_POSTURE_PORT, extra.postureWsUrl);
};
