// Pull-to-refresh for every list and page: the same props as React Native's RefreshControl (refreshing, onRefresh).
// The phone's round spinner is moved out of sight; while refreshing the running car (RefreshCarHost, mounted once in
// App.js) plays under the header, in a clear slot the page makes for it (see useRefreshSlotStyle).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshControl } from 'react-native';
import { useDispatch } from 'react-redux';
import { refreshEnded, refreshStarted } from '../../store/slices/refreshCarSlice';
import { MIN_SHOW_MS } from '../../utils/refreshCar';

const HIDDEN_OFFSET = -160; // the system spinner rests this far above the screen (dp), where nobody sees it

/**
 * @param {boolean} refreshing True while the page is reloading
 * @param {function} onRefresh Called when the user pulls down
 * @param {'stack'|'home'} placement Which header the car runs under ('home' = the taller Home header)
 */
export default function AppRefreshControl({ refreshing, onRefresh, placement = 'stack', ...rest }) {
  const dispatch = useDispatch();
  // A pull keeps the car up for at least MIN_SHOW_MS, also for pages that load without a `refreshing` flag
  const [isHeld, setIsHeld] = useState(false);
  const heldTimer = useRef(null);
  const isShowing = refreshing || isHeld;

  useEffect(() => {
    return () => clearTimeout(heldTimer.current);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsHeld(true);
    clearTimeout(heldTimer.current);
    heldTimer.current = setTimeout(() => setIsHeld(false), MIN_SHOW_MS);
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!isShowing) {
      return undefined;
    }
    dispatch(refreshStarted(placement));
    return () => {
      dispatch(refreshEnded());
    };
  }, [isShowing, placement, dispatch]);

  return (
    <RefreshControl
      refreshing={isShowing}
      onRefresh={handleRefresh}
      colors={['transparent']}
      tintColor="transparent"
      progressBackgroundColor="transparent"
      progressViewOffset={HIDDEN_OFFSET}
      {...rest}
    />
  );
}
