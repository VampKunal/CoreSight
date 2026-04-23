import React from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";

import AppShell from "../components/AppShell";
import RealTimeCamera from "./RealTimeCamera";
import DietScreen from "./DietScreen";
import ProfileScreen from "./ProfileScreen";
import { useAuth } from "../context/AuthContext";
import { COLORS, TYPOGRAPHY } from "../theme";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const CameraStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CameraHome" component={RealTimeCamera} />
  </Stack.Navigator>
);

const DietStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DietHome" component={DietScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} />
  </Stack.Navigator>
);

const CustomDrawerContent = (props) => (
  <AppShell style={styles.drawerShell}>
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContent}
    >
      <View style={styles.drawerBrand}>
        <View style={styles.logoMark}>
          <Icon name="run-fast" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.kicker}>FitTrack AI</Text>
        <Text style={styles.drawerTitle}>Training dashboard</Text>
        <Text style={styles.drawerSubtitle}>
          Posture feedback, diet planning, and profile data in one place.
        </Text>
      </View>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  </AppShell>
);

const MainTabs = () => {
  const { signOut } = useAuth();

  return (
    <Drawer.Navigator
      initialRouteName="Camera"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: "front",
        drawerStyle: styles.drawer,
        drawerActiveTintColor: COLORS.white,
        drawerInactiveTintColor: COLORS.textSecondary,
        drawerActiveBackgroundColor: COLORS.primary,
        drawerLabelStyle: styles.drawerLabel,
      }}
    >
      <Drawer.Screen
        name="Camera"
        component={CameraStack}
        options={{
          drawerLabel: "Camera analysis",
          drawerIcon: ({ color, size }) => (
            <Icon name="camera-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Diet"
        component={DietStack}
        options={{
          drawerLabel: "Diet plans",
          drawerIcon: ({ color, size }) => (
            <Icon name="food-apple-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          drawerLabel: "Profile",
          drawerIcon: ({ color, size }) => (
            <Icon name="account-outline" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="Logout"
        component={CameraStack}
        listeners={{
          drawerItemPress: (event) => {
            event.preventDefault();
            signOut();
          },
        }}
        options={{
          drawerLabel: "Logout",
          drawerIcon: ({ color, size }) => (
            <Icon name="logout" color={color} size={size} />
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerShell: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  drawer: {
    width: 306,
    backgroundColor: COLORS.background,
  },
  drawerContent: {
    paddingTop: 22,
  },
  drawerBrand: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    marginBottom: 8,
  },
  logoMark: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  kicker: TYPOGRAPHY.kicker,
  drawerTitle: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "900",
    marginTop: 5,
  },
  drawerSubtitle: {
    ...TYPOGRAPHY.body,
    marginTop: 8,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
});

export default MainTabs;
