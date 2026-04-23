import "react-native-gesture-handler";
import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import AuthScreen from "./src/screens/AuthScreen";
import MainTabs from "./src/screens/MainTabs";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { COLORS } from "./src/theme";

const Stack = createNativeStackNavigator();

SplashScreen.preventAutoHideAsync().catch(() => {});

const AppNavigator = () => {
  const { authToken, isBooting, refreshSession } = useAuth();

  useEffect(() => {
    if (!isBooting) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isBooting]);

  if (isBooting) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authToken == null ? (
          <Stack.Screen name="Auth">
            {(props) => (
              <AuthScreen {...props} onLoginSuccess={refreshSession} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <GestureHandlerRootView style={styles.root}>
    <AuthProvider>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <AppNavigator />
    </AuthProvider>
  </GestureHandlerRootView>
);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
});

export default App;
