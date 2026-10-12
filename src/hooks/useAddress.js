// The address for a point: the one the server already sent, or one looked up once and shared through Redux.
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAddress, selectAddressText } from '../store/slices/addressSlice';

/**
 * @param {string} knownAddress Address already sent by the server (used as is when not empty)
 * @param {number} latitude
 * @param {number} longitude
 * @returns {string} The address, or '' while it is not known
 */
export default function useAddress(knownAddress, latitude, longitude) {
  const dispatch = useDispatch();
  const hasPoint = latitude != null && longitude != null && Number(latitude) !== 0 && Number(longitude) !== 0;
  const needsLookup = !knownAddress && hasPoint;
  const looked = useSelector(needsLookup ? selectAddressText(latitude, longitude) : () => '');

  useEffect(() => {
    if (needsLookup) {
      dispatch(fetchAddress({ latitude: Number(latitude), longitude: Number(longitude) }));
    }
  }, [dispatch, needsLookup, latitude, longitude]);

  return knownAddress || looked;
}
