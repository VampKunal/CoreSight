import { getApiBaseUrl } from "./apiConfig";
import {
  secureDeleteItem,
  secureGetItem,
  secureSetItem,
} from "./secureStorage";

export const getStoredTokens = async () => {
  const [accessToken, refreshToken] = await Promise.all([
    secureGetItem("accessToken"),
    secureGetItem("refreshToken"),
  ]);

  return { accessToken, refreshToken };
};

export const saveTokens = async ({ accessToken, refreshToken }) => {
  if (accessToken) {
    await secureSetItem("accessToken", accessToken);
  }

  if (refreshToken) {
    await secureSetItem("refreshToken", refreshToken);
  }
};

export const clearTokens = async () => {
  await Promise.all([
    secureDeleteItem("accessToken"),
    secureDeleteItem("refreshToken"),
  ]);
};

export const refreshAccessToken = async () => {
  const { refreshToken } = await getStoredTokens();

  if (!refreshToken) {
    throw new Error("Session expired. Please sign in again.");
  }

  const response = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: refreshToken }),
  });

  const data = await response.json();

  if (!response.ok) {
    await clearTokens();
    throw new Error(data.message || "Session expired. Please sign in again.");
  }

  await saveTokens(data);
  return data.accessToken;
};
