import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  USER_PROFILE: 'fittrack_profile',
  DIET_PLANS: 'fittrack_diet_plans',
  POSTURE_HISTORY: 'fittrack_posture_history',
};

class OfflineCacheService {
  /**
   * Stashes data into the local storage.
   */
  async stash(key, data) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Caching error', e);
    }
  }

  /**
   * Retrieves data from the local storage.
   */
  async retrieve(key) {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Retrieval error', e);
      return null;
    }
  }

  /**
   * Clears the cache.
   */
  async clear() {
    try {
      await AsyncStorage.multiRemove(Object.values(CACHE_KEYS));
    } catch (e) {
      console.error('Clear cache error', e);
    }
  }
}

export { CACHE_KEYS };
export default new OfflineCacheService();
