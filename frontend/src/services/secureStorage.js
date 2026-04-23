import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const canUseSecureStore = Platform.OS !== "web";

export const secureGetItem = async (key) => {
  if (canUseSecureStore) {
    return SecureStore.getItemAsync(key);
  }

  return AsyncStorage.getItem(key);
};

export const secureSetItem = async (key, value) => {
  if (canUseSecureStore) {
    return SecureStore.setItemAsync(key, value);
  }

  return AsyncStorage.setItem(key, value);
};

export const secureDeleteItem = async (key) => {
  if (canUseSecureStore) {
    return SecureStore.deleteItemAsync(key);
  }

  return AsyncStorage.removeItem(key);
};
