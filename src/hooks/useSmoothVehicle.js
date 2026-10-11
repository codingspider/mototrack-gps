// Makes a vehicle marker glide between live positions instead of jumping, keeps a trail of where it went
// (each point is added when the marker reaches it), and moves the camera along with it while "follow" is on.
import { useEffect, useRef, useState } from 'react';
import { Easing } from 'react-native';
import { AnimatedRegion } from 'react-native-maps';

const MIN_GLIDE_MS = 1000; // a glide is never shorter or longer than this
const MAX_GLIDE_MS = 6000;
const MAX_TRAIL_POINTS = 60;

/**
 * @param {number|null} latitude Live latitude from Redux
 * @param {number|null} longitude Live longitude from Redux
 * @param {object} mapRef Ref of the MapView (to move the camera)
 * @param {object} isFollowingRef Ref with true while the camera should follow the vehicle
 * @returns {{ markerCoordinate: object|null, trail: Array }} Animated marker position and the live trail
 */
export default function useSmoothVehicle(latitude, longitude, mapRef, isFollowingRef) {
  const hasLocation = latitude !== null && longitude !== null;
  const markerCoordinate = useRef(null);
  const lastUpdateAt = useRef(Date.now());
  const averageGapMs = useRef(MIN_GLIDE_MS * 2);
  const isFirstPosition = useRef(true);
  const [trail, setTrail] = useState([]);
  const trailTimers = useRef([]);

  // Points still waiting for the marker to reach them are dropped when the screen closes
  useEffect(() => {
    const timers = trailTimers.current;
    return () => timers.forEach((timer) => clearTimeout(timer));
  }, []);

  // The marker position is an animated value, created once at the first known position
  if (!markerCoordinate.current && hasLocation) {
    markerCoordinate.current = new AnimatedRegion({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0 });
  }

  // A new live position arrives: glide there over about the time between updates, so it keeps moving smoothly.
  useEffect(() => {
    if (!hasLocation || !markerCoordinate.current) {
      return;
    }
    if (isFirstPosition.current) {
      isFirstPosition.current = false;
      lastUpdateAt.current = Date.now();
      return;
    }
    const now = Date.now();
    averageGapMs.current = averageGapMs.current * 0.5 + (now - lastUpdateAt.current) * 0.5;
    lastUpdateAt.current = now;
    const duration = Math.min(Math.max(averageGapMs.current, MIN_GLIDE_MS), MAX_GLIDE_MS);

    markerCoordinate.current
      .timing({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0, duration, easing: Easing.linear, useNativeDriver: false })
      .start();
    // The line gets this point only when the marker arrives there, so the line never runs ahead of the vehicle
    const reachedAt = setTimeout(() => {
      trailTimers.current = trailTimers.current.filter((timer) => timer !== reachedAt);
      setTrail((previous) => [...previous, { latitude, longitude }].slice(-MAX_TRAIL_POINTS));
    }, duration);
    trailTimers.current.push(reachedAt);

    // Camera follows at the same pace and keeps the user's zoom
    if (isFollowingRef.current) {
      mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration });
    }
  }, [latitude, longitude, hasLocation, mapRef, isFollowingRef]);

  return { markerCoordinate: markerCoordinate.current, trail };
}
