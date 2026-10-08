// Radar signal around the vehicle: three rings grow outward and fade, one after another, like the tracker is
// sending a signal. Drawn as map circles (put inside <MapView>), so the rings grow with the map zoom and follow
// the marker while it glides. Does nothing when `isActive` is false.
import React, { useEffect, useState } from 'react';
import { Circle } from 'react-native-maps';

const PULSE_MS = 2400; // one ring takes this long to grow and fade
const FRAME_MS = 66; // about 15 redraws per second is smooth enough and light on the phone
const RING_COUNT = 3;
const STROKE_ALPHA = 0.95; // opacity of a new ring's line
const FILL_ALPHA = 0.35;

/** "#rrggbb" + opacity 0..1 -> "#rrggbbaa" */
function withAlpha(hexColor, opacity) {
  const value = Math.round(Math.max(0, Math.min(1, opacity)) * 255);
  return `${hexColor}${value.toString(16).padStart(2, '0')}`;
}

/**
 * @param {object} coordinate The marker's animated position (AnimatedRegion), so rings move with the marker
 * @param {string} color Ring color, "#rrggbb" (the vehicle status color)
 * @param {number} maxMeters How far a ring grows before it fades out completely
 * @param {boolean} isActive Show the rings
 */
export default function RadarPulse({ coordinate, color, maxMeters, isActive }) {
  const [frame, setFrame] = useState({ progress: 0, latitude: null, longitude: null });

  useEffect(() => {
    if (!isActive || !coordinate) {
      return undefined;
    }
    const startedAt = Date.now();
    const timer = setInterval(() => {
      const position = coordinate.__getValue(); // where the marker is right now (it may be mid-glide)
      setFrame({
        progress: ((Date.now() - startedAt) % PULSE_MS) / PULSE_MS,
        latitude: position.latitude,
        longitude: position.longitude,
      });
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, [isActive, coordinate]);

  if (!isActive || frame.latitude === null) {
    return null;
  }

  const center = { latitude: frame.latitude, longitude: frame.longitude };
  const rings = [];
  for (let index = 0; index < RING_COUNT; index += 1) {
    // Rings are spaced evenly in time, so there is always one just starting and one almost gone
    const t = (frame.progress + index / RING_COUNT) % 1;
    const fade = 1 - t; // fades evenly, so the outer part of the ring stays visible
    rings.push(
      <Circle
        key={index}
        center={center}
        radius={Math.max(1, t * maxMeters)}
        strokeColor={withAlpha(color, fade * STROKE_ALPHA)}
        fillColor={withAlpha(color, fade * FILL_ALPHA)}
        strokeWidth={3}
        zIndex={1}
      />,
    );
  }
  return <>{rings}</>;
}
