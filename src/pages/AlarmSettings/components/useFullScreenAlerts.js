// Whether the phone lets a call alert open over the lock screen (Android 14+ "Full screen notifications"), read again
// whenever the customer comes back to the app (they may have just changed it in the phone settings).
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { canUseFullScreenAlerts } from '../../../utils/appNotification';

/** @returns {boolean} false when full-screen alerts are switched off for this app */
export default function useFullScreenAlerts() {
  const [canShowFullScreen, setCanShowFullScreen] = useState(true);

  const check = useCallback(async () => {
    setCanShowFullScreen(await canUseFullScreenAlerts());
  }, []);

  useEffect(() => {
    check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        check();
      }
    });
    return () => subscription.remove();
  }, [check]);

  return canShowFullScreen;
}
