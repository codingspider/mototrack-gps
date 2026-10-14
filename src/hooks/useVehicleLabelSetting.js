// "Show the vehicle name on the map": on or off, remembered on the phone like the theme and the language.
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_map_vehicle_label'; // '1' | '0' (not a secret, so AsyncStorage is fine)

/** @returns {{ isLabelShown: boolean, toggleLabel: function }} On by default until the customer turns it off. */
export default function useVehicleLabelSetting() {
  const [isLabelShown, setIsLabelShown] = useState(true);

  // Read the saved choice once
  useEffect(() => {
    let isActive = true;
    const loadSetting = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (isActive && value !== null) {
          setIsLabelShown(value === '1');
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

  const toggleLabel = useCallback(async () => {
    const next = !isLabelShown;
    setIsLabelShown(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch (error) {
      // The choice still works for this session
    }
  }, [isLabelShown]);

  return { isLabelShown, toggleLabel };
}
