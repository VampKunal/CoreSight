import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

import RealTimeCamera from './RealTimeCamera';
import DietScreen from './DietScreen';
import ProfileScreen from './ProfileScreen';

const Stack = createNativeStackNavigator();

const MENU_ITEMS = [
  { route: 'Camera', label: 'Camera analysis', icon: 'camera-outline', description: 'Check exercise form and posture.' },
  { route: 'Diet', label: 'Diet plans', icon: 'food-apple-outline', description: 'Generate nutrition plans from your profile.' },
  { route: 'Profile', label: 'Profile', icon: 'account-outline', description: 'Update goals, body data, and conditions.' },
];

const MenuScreen = ({ navigation }) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.kicker}>FitTrack</Text>
      <Text style={styles.title}>Menu</Text>
      <Text style={styles.subtitle}>Choose where you want to go next.</Text>
    </View>

    <View style={styles.menuList}>
      {MENU_ITEMS.map((item) => (
        <TouchableOpacity key={item.route} style={styles.menuItem} onPress={() => navigation.navigate(item.route)} activeOpacity={0.86}>
          <View style={styles.iconBox}>
            <Icon name={item.icon} size={25} color="#FFFFFF" />
          </View>
          <View style={styles.menuCopy}>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Text style={styles.menuDescription}>{item.description}</Text>
          </View>
          <Icon name="chevron-right" size={24} color="rgba(255,255,255,0.45)" />
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const MainTabs = ({ setAuthToken }) => {
  return (
    <Stack.Navigator initialRouteName="Camera" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Camera" component={RealTimeCamera} />
      <Stack.Screen name="Menu" component={MenuScreen} />
      <Stack.Screen name="Diet" component={DietScreen} />
      <Stack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={() => setAuthToken(null)} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0D10',
    padding: 20,
    paddingTop: 72,
  },
  header: {
    marginBottom: 28,
  },
  kicker: {
    color: '#E85D2A',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '900',
    marginTop: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.66)',
    fontSize: 16,
    lineHeight: 23,
    marginTop: 8,
  },
  menuList: {
    gap: 14,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171C24',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 18,
    padding: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E85D2A',
    marginRight: 14,
  },
  menuCopy: {
    flex: 1,
  },
  menuLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  menuDescription: {
    color: 'rgba(255,255,255,0.58)',
    marginTop: 3,
    lineHeight: 19,
  },
});

export default MainTabs;
