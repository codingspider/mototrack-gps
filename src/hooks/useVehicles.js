// Gives a page the shared vehicle list from Redux. Loads it only if missing or stale.
import { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchVehicles,
  selectAllVehicles,
  selectVehiclesError,
  selectVehiclesStatus,
} from '../store/slices/vehiclesSlice';

/** @returns {{vehicles: object[], isLoading: boolean, error: string|null, refresh: function}} */
export default function useVehicles() {
  const dispatch = useDispatch();
  const vehicles = useSelector(selectAllVehicles);
  const status = useSelector(selectVehiclesStatus);
  const error = useSelector(selectVehiclesError);

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const refresh = useCallback(() => dispatch(fetchVehicles({ force: true })), [dispatch]);

  return { vehicles, isLoading: status === 'loading', error, refresh };
}