import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import AuthScreen from './src/screens/AuthScreen';
import MainTabs from './src/screens/MainTabs';

const Stack = createNativeStackNavigator();

const App = () => {
  const [authToken, setAuthToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkToken();
  }, []);

  const checkToken = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      setAuthToken(token);
    } catch (e) {
      console.error(e);
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
