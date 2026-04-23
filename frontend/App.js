import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';

import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/screens/MainTabs';
import { clearTokens, getStoredTokens, refreshAccessToken } from './src/services/authService';

const Stack = createNativeStackNavigator();

const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
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
    } catch (e) {
      console.error(e);
      await clearTokens();
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d0d12', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#ff6b00" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authToken == null ? (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onLoginSuccess={checkToken} />}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainTabs">
            {(props) => <MainTabs {...props} setAuthToken={setAuthToken} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
