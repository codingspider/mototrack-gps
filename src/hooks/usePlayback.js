// The playback player: a clock that runs through the recorded trip. Play / pause, speed, skip stops, jump, seek.
// `playTime` is a moment of the trip (unix seconds). The route data itself stays in Redux.
import { useCallback, useEffect, useRef, useState } from 'react';

export const SPEEDS = [1, 2, 4, 8];
const TRIP_SECONDS_PER_SECOND = 60; // at 1x one real second plays one trip minute
const TICK_MS = 50;
const JUMP_PLAYBACK_SECONDS = 10; // the "10s" buttons jump this many playback seconds

/**
 * @param {number|null} startTime First moment of the trip
 * @param {number|null} endTime Last moment of the trip
 * @param {Array} stops Stops from findStops (used by "skip stops")
 */
export default function usePlayback(startTime, endTime, stops) {
  const [playTime, setPlayTime] = useState(startTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(SPEEDS[0]);
  const [isSkippingStops, setIsSkippingStops] = useState(false);
  const speedRef = useRef(speed);
  const skipRef = useRef(isSkippingStops);
  const stopsRef = useRef(stops);
  speedRef.current = speed;
  skipRef.current = isSkippingStops;
  stopsRef.current = stops;

  const hasEnded = !!endTime && playTime >= endTime;

  // A different trip loaded: back to the start, paused
  useEffect(() => {
    setPlayTime(startTime || 0);
    setIsPlaying(false);
  }, [startTime, endTime]);

  // The clock
  useEffect(() => {
    if (!isPlaying || !endTime) {
      return undefined;
    }
    const timer = setInterval(() => {
      setPlayTime((current) => {
        let next = current + (TICK_MS / 1000) * TRIP_SECONDS_PER_SECOND * speedRef.current;
        if (skipRef.current) {
          const stop = stopsRef.current.find((item) => next > item.startTime && next < item.endTime);
          if (stop) {
            next = stop.endTime; // jump over the pause
          }
        }
        return Math.min(next, endTime);
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [isPlaying, endTime]);

  // Stop the clock at the end of the trip
  useEffect(() => {
    if (hasEnded) {
      setIsPlaying(false);
    }
  }, [hasEnded]);

  const toggle = useCallback(() => {
    if (!endTime) {
      return;
    }
    if (playTime >= endTime) {
      setPlayTime(startTime); // play again from the start
    }
    setIsPlaying((current) => !current);
  }, [playTime, startTime, endTime]);

  const restart = useCallback(() => {
    setPlayTime(startTime || 0);
    setIsPlaying(true);
  }, [startTime]);

  const jump = useCallback(
    (direction) => {
      const seconds = direction * JUMP_PLAYBACK_SECONDS * TRIP_SECONDS_PER_SECOND;
      setPlayTime((current) => Math.min(Math.max(current + seconds, startTime), endTime));
    },
    [startTime, endTime],
  );

  /** @param {number} share 0..1 along the trip */
  const seek = useCallback(
    (share) => {
      setPlayTime(startTime + (endTime - startTime) * Math.min(Math.max(share, 0), 1));
    },
    [startTime, endTime],
  );

  const share = endTime > startTime ? (playTime - startTime) / (endTime - startTime) : 0;

  return {
    playTime,
    share,
    isPlaying,
    hasEnded,
    speed,
    isSkippingStops,
    setSpeed,
    setIsSkippingStops,
    toggle,
    restart,
    jump,
    seek,
  };
}
