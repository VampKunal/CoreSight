import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearTokens,
  getStoredTokens,
  refreshAccessToken,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isBooting, setIsBooting] = useState(true);

  const bootstrapAuth = useCallback(async () => {
    try {
      const { accessToken, refreshToken } = await getStoredTokens();

      if (accessToken) {
        setAuthToken(accessToken);
        return;
      }

      if (refreshToken) {
        const nextToken = await refreshAccessToken();
        setAuthToken(nextToken);
        return;
      }

      setAuthToken(null);
    } catch (error) {
      console.error(error);
      await clearTokens();
      setAuthToken(null);
    } finally {
      setIsBooting(false);
    }
  }, []);

  useEffect(() => {
    bootstrapAuth();
  }, [bootstrapAuth]);

  const signOut = useCallback(async () => {
    await clearTokens();
    setAuthToken(null);
  }, []);

  const value = useMemo(
    () => ({
      authToken,
      isBooting,
      refreshSession: bootstrapAuth,
      setAuthToken,
      signOut,
    }),
    [authToken, bootstrapAuth, isBooting, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
