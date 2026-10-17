// "Show the vehicle tail on the map": on or off, remembered on the phone like the vehicle name setting.
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_map_vehicle_tail'; // '1' | '0' (not a secret, so AsyncStorage is fine)

/** @returns {{ isTailShown: boolean, toggleTail: function }} On by default until the customer turns it off. */
export default function useMapTailSetting() {
  const [isTailShown, setIsTailShown] = useState(true);

  // Read the saved choice once
  useEffect(() => {
    let isActive = true;
    const loadSetting = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (isActive && value !== null) {
          setIsTailShown(value === '1');
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

  const toggleTail = useCallback(async () => {
    const next = !isTailShown;
    setIsTailShown(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (error) {
      // The choice still works for this session
    }
  }, [isTailShown]);

  return { isTailShown, toggleTail };
}
