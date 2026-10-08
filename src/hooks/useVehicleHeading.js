// The heading (compass degrees) the vehicle picture should face. Like a real vehicle it faces the direction it
// drives, turns smoothly through corners instead of snapping, and keeps facing the same way when parked.
import { useEffect, useRef, useState } from 'react';
import { nextHeading, shortestTurn } from '../utils/heading';

const TURN_MS = 700; // a turn takes this long
const TURN_STEP_MS = 50;

/**
 * @param {number|null} latitude Live latitude
 * @param {number|null} longitude Live longitude
 * @param {number} deviceCourse Heading reported by the tracker device (used until the vehicle moves)
 * @returns {number} Heading to draw, 0..359
 */
export default function useVehicleHeading(latitude, longitude, deviceCourse) {
  const [heading, setHeading] = useState(deviceCourse || 0);
  const targetRef = useRef(deviceCourse || 0);
  const shownRef = useRef(deviceCourse || 0);
  const previousPointRef = useRef(null);
  const hasMovedRef = useRef(false);

  // Before the vehicle has moved, follow the device heading (it may arrive a moment after the first position)
  useEffect(() => {
    if (!hasMovedRef.current) {
      targetRef.current = deviceCourse || 0;
    }
  }, [deviceCourse]);

  // A new position: work out the new target heading
  useEffect(() => {
    if (latitude === null || longitude === null) {
      return;
    }
    const point = { latitude, longitude };
    const newTarget = nextHeading(previousPointRef.current, point, targetRef.current);
    if (newTarget !== targetRef.current && previousPointRef.current) {
      hasMovedRef.current = true;
    }
    targetRef.current = newTarget;
    previousPointRef.current = point;
  }, [latitude, longitude]);

  // Turn the picture toward the target in small steps
  useEffect(() => {
    const timer = setInterval(() => {
      const turn = shortestTurn(shownRef.current, targetRef.current);
      if (Math.abs(turn) < 1) {
        return;
      }
      const maxStep = (180 / TURN_MS) * TURN_STEP_MS; // fastest turn: half a circle per TURN_MS
      const step = Math.sign(turn) * Math.min(Math.abs(turn), Math.max(maxStep, Math.abs(turn) * 0.35));
      shownRef.current = (shownRef.current + step + 360) % 360;
      setHeading(shownRef.current);
    }, TURN_STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return heading;
}
