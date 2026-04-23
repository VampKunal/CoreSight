import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from './apiConfig';

export const getStoredTokens = async () => {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem('accessToken'),
    AsyncStorage.getItem('refreshToken'),
  ]);

  return { accessToken, refreshToken };
};

export const saveTokens = async ({ accessToken, refreshToken }) => {
  if (accessToken) {
    await AsyncStorage.setItem('accessToken', accessToken);
  }

  if (refreshToken) {
    await AsyncStorage.setItem('refreshToken', refreshToken);
  }
};

export const clearTokens = async () => {
  await Promise.all([
    AsyncStorage.removeItem('accessToken'),
    AsyncStorage.removeItem('refreshToken'),
  ]);
};

export const refreshAccessToken = async () => {
  const { refreshToken } = await getStoredTokens();

  if (!refreshToken) {
    throw new Error('Session expired. Please sign in again.');
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    await clearTokens();
    throw new Error(data.message || 'Session expired. Please sign in again.');
  }

  await saveTokens(data);
  return data.accessToken;
};
