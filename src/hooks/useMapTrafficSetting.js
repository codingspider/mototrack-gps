// "Show Google's live traffic on the roads": on or off, remembered on the phone like the tail setting.
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_map_traffic'; // '1' | '0' (not a secret, so AsyncStorage is fine)

/** @returns {{ isTrafficShown: boolean, toggleTraffic: function }} Off by default until the customer turns it on. */
export default function useMapTrafficSetting() {
  const [isTrafficShown, setIsTrafficShown] = useState(false);

  // Read the saved choice once
  useEffect(() => {
    let isActive = true;
    const loadSetting = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (isActive && value !== null) {
          setIsTrafficShown(value === '1');
        }
      } catch (error) {
        // Storage not available: keep the default
      }
    };
    loadSetting();
    return () => {
      isActive = false;
    };
  }, []);

  const toggleTraffic = useCallback(async () => {
    const next = !isTrafficShown;
    setIsTrafficShown(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (error) {
      // The choice still works for this session
    }
  }, [isTrafficShown]);

  return { isTrafficShown, toggleTraffic };
}
