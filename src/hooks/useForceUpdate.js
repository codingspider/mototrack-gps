// Forced update from the Play Store: asks Google Play (through the native AppUpdate module) if a newer version is
// published, on start and every time the app comes back to the front. When there is one, Play's full screen update
// opens by itself; if the customer backs out, `isRequired` stays true and the UpdateGate screen keeps the app blocked.
// Builds that are not from Google Play (debug, APK by hand) never get an update, so development is not blocked.
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, NativeModules, Platform } from 'react-native';
import { isUpdateRequired } from '../utils/appUpdate';
import { openPlayStoreRating } from '../utils/rateApp';

const { AppUpdate } = NativeModules;
const AUTO_START_GAP_MS = 3000; // do not reopen Play's screen right after the customer closed it

/** @returns {{ isRequired: boolean, isStarting: boolean, startUpdate: function }} */
export default function useForceUpdate() {
  const [isRequired, setIsRequired] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const isBusy = useRef(false);
  const lastEndedAt = useRef(0);

  const startUpdate = useCallback(async () => {
    if (!AppUpdate || isBusy.current) {
      return;
    }
    isBusy.current = true;
    setIsStarting(true);
    try {
      const result = await AppUpdate.startImmediateUpdate();
      if (result === 'failed') {
        // Play's screen could not open: send the customer to the app's Play Store page instead
        await openPlayStoreRating();
      }
    } catch (error) {
      await openPlayStoreRating();
    } finally {
      lastEndedAt.current = Date.now();
      isBusy.current = false;
      setIsStarting(false);
    }
  }, []);

  const check = useCallback(async () => {
    if (Platform.OS !== 'android' || !AppUpdate) {
      return;
    }
    try {
      const info = await AppUpdate.getUpdateInfo();
      const isNeeded = isUpdateRequired(info);
      setIsRequired(isNeeded);
      if (isNeeded && Date.now() - lastEndedAt.current > AUTO_START_GAP_MS) {
        startUpdate();
      }
    } catch (error) {
      // Never block the app because the check itself failed
    }
  }, [startUpdate]);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  return { isRequired, isStarting, startUpdate };
}
