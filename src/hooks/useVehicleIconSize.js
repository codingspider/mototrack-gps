// "Vehicle icon size on the map": small / medium / large / extra large, remembered on the phone (no server call).
import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_map_vehicle_icon_size'; // one of the keys below (not a secret, so AsyncStorage is fine)

/** The choices in the order the settings row cycles through them. `scale` multiplies the normal marker size. */
export const ICON_SIZES = [
  { key: 'small', scale: 1 },
  { key: 'medium', scale: 1.4 },
  { key: 'large', scale: 1.8 },
  { key: 'xlarge', scale: 2.3 },
];

/** @returns {{ sizeKey: string, scale: number, nextSize: function }} Small by default until the customer changes it. */
export default function useVehicleIconSize() {
  const [sizeKey, setSizeKey] = useState(ICON_SIZES[0].key);

  // Read the saved choice once
  useEffect(() => {
    let isActive = true;
    const loadSetting = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (isActive && ICON_SIZES.some((size) => size.key === value)) {
          setSizeKey(value);
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

  // Go to the next size (after the biggest it starts again from the smallest)
  const nextSize = useCallback(async () => {
    const index = ICON_SIZES.findIndex((size) => size.key === sizeKey);
    const next = ICON_SIZES[(index + 1) % ICON_SIZES.length].key;
    setSizeKey(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      // The choice still works for this session
    }
  }, [sizeKey]);

  const current = ICON_SIZES.find((size) => size.key === sizeKey) || ICON_SIZES[0];
  return { sizeKey, scale: current.scale, nextSize };
}
