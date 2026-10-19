// The address for a point: the one the server already sent, or one looked up once and shared through Redux.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddress, selectAddressStatus, selectAddressText } from '../store/slices/addressSlice';
import { distanceMeters } from '../utils/heading';

// A live vehicle's address is looked up again only after it has gone this far, and not more often than this
const LIVE_MOVE_METERS = 100;
const LIVE_MIN_GAP_MS = 30 * 1000;

/**
 * @param {string} knownAddress Address already sent by the server (used as is when not empty)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {{ address: string, isFailed: boolean, retry: function }} address is '' while it is not known;
 *   isFailed is true when the lookup ended without an address; retry asks the server again.
 */
export function useAddressLookup(knownAddress, latitude, longitude) {
  const dispatch = useDispatch();
  const hasPoint = latitude != null && longitude != null && Number(latitude) !== 0 && Number(longitude) !== 0;
  const needsLookup = !knownAddress && hasPoint;
  const looked = useSelector(needsLookup ? selectAddressText(latitude, longitude) : () => '');
  const status = useSelector(needsLookup ? selectAddressStatus(latitude, longitude) : () => '');

  // Asks once per place: a failed lookup is not repeated by itself, only through retry()
  useEffect(() => {
    if (needsLookup && !status) {
      dispatch(fetchAddress({ latitude: Number(latitude), longitude: Number(longitude) }));
    }
  }, [dispatch, needsLookup, status, latitude, longitude]);

  const retry = useCallback(() => {
    if (needsLookup) {
      dispatch(fetchAddress({ latitude: Number(latitude), longitude: Number(longitude) }));
    }
  }, [dispatch, needsLookup, latitude, longitude]);

  return { address: knownAddress || looked, isFailed: !knownAddress && status === 'failed', retry };
}

/** Same as useAddressLookup, but returns only the address text ('' while it is not known). */
export default function useAddress(knownAddress, latitude, longitude) {
  return useAddressLookup(knownAddress, latitude, longitude).address;
}

/** A real position (numbers, and not the 0,0 a tracker without a GPS fix sends), or null. */
function toLivePoint(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return null;
  }
  const point = { latitude: Number(latitude), longitude: Number(longitude) };
  const isReal = Number.isFinite(point.latitude) && Number.isFinite(point.longitude) && !(point.latitude === 0 && point.longitude === 0);
  return isReal ? point : null;
}

/**
 * The address of where a live vehicle is now. While it drives, the address follows it, but it is looked up again only
 * after LIVE_MOVE_METERS and at most every LIVE_MIN_GAP_MS (every lookup can cost a Google request).
 * @param {number|string} latitude
 * @param {number|string} longitude
 * @param {number|string} subjectKey The vehicle id: another vehicle gets its address right away, without the wait
 * @returns {{ address: string, isLooking: boolean }} address '' while not known; isLooking while it is being found
 */
export function useLiveAddress(latitude, longitude, subjectKey) {
  const [point, setPoint] = useState(() => toLivePoint(latitude, longitude));
  const pointRef = useRef(point);
  const changedAtRef = useRef(Date.now());
  const latestRef = useRef(point);
  const timerRef = useRef(null);
  const subjectRef = useRef(subjectKey);
  const pointSubjectRef = useRef(subjectKey); // the vehicle the looked-up point belongs to

  latestRef.current = toLivePoint(latitude, longitude);
  subjectRef.current = subjectKey;

  // Moves the looked-up point to the vehicle when it has gone far enough. If it went far but too soon, checks again
  // when the gap is over (a parked vehicle sends no new position that would wake this up).
  const update = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current); // a newer check replaces the waiting one
      timerRef.current = null;
    }
    const latest = latestRef.current;
    const isSameSubject = pointSubjectRef.current === subjectRef.current;
    if (!latest) {
      if (!isSameSubject) {
        // another vehicle without a position: forget the old vehicle's address
        pointSubjectRef.current = subjectRef.current;
        pointRef.current = null;
        setPoint(null);
      }
      return;
    }
    const current = isSameSubject ? pointRef.current : null;
    if (current && distanceMeters(current, latest) <= LIVE_MOVE_METERS) {
      return;
    }
    const waitMs = current ? LIVE_MIN_GAP_MS - (Date.now() - changedAtRef.current) : 0;
    if (waitMs > 0) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(update, waitMs);
      }
      return;
    }
    changedAtRef.current = Date.now();
    pointSubjectRef.current = subjectRef.current;
    pointRef.current = latest;
    setPoint(latest);
  }, []);

  useEffect(() => {
    update();
  }, [latitude, longitude, subjectKey, update]);

  useEffect(
    () => () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const { address, isFailed } = useAddressLookup('', point ? point.latitude : null, point ? point.longitude : null);
  return { address, isLooking: !!point && !address && !isFailed };
}
