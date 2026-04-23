import { getApiBaseUrl } from './apiConfig';
import { clearTokens, getStoredTokens, refreshAccessToken } from './authService';

const parseJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
};

export const apiFetch = async (path, options = {}, retry = true) => {
  const { accessToken } = await getStoredTokens();
  const headers = {
    ...(options.headers || {}),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && retry) {
    try {
      const nextAccessToken = await refreshAccessToken();
      return apiFetch(
        path,
        {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${nextAccessToken}`,
          },
        },
        false
      );
    } catch (error) {
      await clearTokens();
      throw error;
    }
  }

  const data = await parseJson(response);

  if (!response.ok) {
    throw new Error(data?.message || data?.detail || 'Request failed');
  }

  return data;
};
