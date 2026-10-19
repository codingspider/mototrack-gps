// useLiveAddress: the details page address follows a driving vehicle, but is not looked up for every small move.
import React from 'react';
import { act, create } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import * as addressApi from '../src/api/addressApi';
import addressReducer from '../src/store/slices/addressSlice';
import { useLiveAddress } from '../src/hooks/useAddress';

const flush = () => act(async () => {});

function Probe({ point, vehicleId, onResult }) {
  onResult(useLiveAddress(point && point.latitude, point && point.longitude, vehicleId));
  return null;
}

describe('useLiveAddress', () => {
  let asked;
  let result;
  let renderer;
  let store;

  const render = async (point, vehicleId = 1) => {
    const element = (
      <Provider store={store}>
        <Probe point={point} vehicleId={vehicleId} onResult={(value) => (result = value)} />
      </Provider>
    );
    if (renderer) {
      await act(async () => renderer.update(element));
    } else {
      await act(async () => {
        renderer = create(element);
      });
    }
    await flush();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    asked = [];
    renderer = null;
    store = configureStore({ reducer: { address: addressReducer } });
    jest.spyOn(addressApi, 'getGeoAddress').mockImplementation(async (latitude, longitude) => {
      asked.push(`${latitude.toFixed(4)},${longitude.toFixed(4)}`);
      return `Place ${asked.length}`;
    });
    jest.spyOn(addressApi, 'getGoogleAddress').mockResolvedValue('');
  });

  afterEach(() => {
    act(() => renderer && renderer.unmount());
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('looks up where the vehicle is', async () => {
    await render({ latitude: 25.3, longitude: 89.3 });
    expect(result.address).toBe('Place 1');
    expect(asked).toHaveLength(1);
  });

  it('does not ask again for a small move', async () => {
    await render({ latitude: 25.3, longitude: 89.3 });
    jest.advanceTimersByTime(60 * 1000);
    await render({ latitude: 25.3002, longitude: 89.3 }); // about 22 m
    expect(asked).toHaveLength(1);
    expect(result.address).toBe('Place 1');
  });

  it('follows a driving vehicle, but waits 30 seconds between lookups', async () => {
    await render({ latitude: 25.3, longitude: 89.3 });
    await render({ latitude: 25.31, longitude: 89.3 }); // 1.1 km away, right away
    expect(asked).toHaveLength(1);
    await act(async () => {
      jest.advanceTimersByTime(30 * 1000); // no new position needed: it checks again when the wait is over
    });
    await flush();
    expect(asked).toHaveLength(2);
    expect(result.address).toBe('Place 2');
  });

  it('shows another vehicle\'s address right away', async () => {
    await render({ latitude: 25.3, longitude: 89.3 }, 1);
    await render({ latitude: 24.8, longitude: 89.4 }, 2);
    expect(asked).toHaveLength(2);
    expect(result.address).toBe('Place 2');
  });

  it('has nothing to look up without a GPS position', async () => {
    await render({ latitude: 0, longitude: 0 });
    expect(asked).toHaveLength(0);
    expect(result).toEqual({ address: '', isLooking: false });
  });
});
