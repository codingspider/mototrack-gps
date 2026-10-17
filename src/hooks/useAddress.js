// The address for a point: the one the server already sent, or one looked up once and shared through Redux.
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddress, selectAddressStatus, selectAddressText } from '../store/slices/addressSlice';

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
