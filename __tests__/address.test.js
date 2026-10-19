// addressKey groups nearby points; parseAddress reads the /geo_address answer.
import { configureStore } from '@reduxjs/toolkit';
import * as addressApi from '../src/api/addressApi';
import { pickGoogleAddress } from '../src/api/addressApi';
import addressReducer, {
  addressKey,
  fetchAddress,
  parseAddress,
  selectAddressStatus,
  selectAddressText,
} from '../src/store/slices/addressSlice';

describe('addressKey', () => {
  it('gives the same key for points a few metres apart', () => {
    expect(addressKey(24.84651, 89.37301)).toBe(addressKey(24.846512, 89.373008));
  });
});

describe('parseAddress', () => {
  it('reads a plain string', () => {
    expect(parseAddress(' Bogura City Bypass ')).toBe('Bogura City Bypass');
  });

  it('reads data / address / items wrappers', () => {
    expect(parseAddress({ status: 1, data: 'A road' })).toBe('A road');
    expect(parseAddress({ address: 'B road' })).toBe('B road');
    expect(parseAddress({ items: 'C road' })).toBe('C road');
  });

  it('returns an empty string for anything else', () => {
    expect(parseAddress(null)).toBe('');
    expect(parseAddress({ status: 0 })).toBe('');
  });
});

describe('pickGoogleAddress', () => {
  it('takes the first real place, not a plus code', () => {
    const answer = {
      status: 'OK',
      results: [
        { formatted_address: '8Q7X+2F Bogura', types: ['plus_code'] },
        { formatted_address: 'Charmatha, Bogura, Bangladesh', types: ['route'] },
      ],
    };
    expect(pickGoogleAddress(answer)).toBe('Charmatha, Bogura, Bangladesh');
  });

  it('is empty when Google has nothing or refuses', () => {
    expect(pickGoogleAddress({ status: 'ZERO_RESULTS', results: [] })).toBe('');
    expect(pickGoogleAddress({ status: 'REQUEST_DENIED' })).toBe('');
    expect(pickGoogleAddress(null)).toBe('');
  });
});

describe('fetchAddress', () => {
  const makeStore = () => configureStore({ reducer: { address: addressReducer } });
  const point = { latitude: 25.30736, longitude: 89.27935 };

  afterEach(() => jest.restoreAllMocks());

  it('uses the server address when it has one, without asking Google', async () => {
    jest.spyOn(addressApi, 'getGeoAddress').mockResolvedValue('Bogura bypass');
    const google = jest.spyOn(addressApi, 'getGoogleAddress').mockResolvedValue('Google road');
    const store = makeStore();
    await store.dispatch(fetchAddress(point));
    expect(selectAddressText(point.latitude, point.longitude)(store.getState())).toBe('Bogura bypass');
    expect(google).not.toHaveBeenCalled();
  });

  it('asks Google when the server answers "-"', async () => {
    jest.spyOn(addressApi, 'getGeoAddress').mockResolvedValue('-');
    jest.spyOn(addressApi, 'getGoogleAddress').mockResolvedValue('Charmatha, Bogura');
    const store = makeStore();
    await store.dispatch(fetchAddress(point));
    expect(selectAddressText(point.latitude, point.longitude)(store.getState())).toBe('Charmatha, Bogura');
  });

  it('asks Google when the server cannot be reached', async () => {
    jest.spyOn(addressApi, 'getGeoAddress').mockRejectedValue(new Error('Network Error'));
    jest.spyOn(addressApi, 'getGoogleAddress').mockResolvedValue('Charmatha, Bogura');
    const store = makeStore();
    await store.dispatch(fetchAddress(point));
    expect(selectAddressText(point.latitude, point.longitude)(store.getState())).toBe('Charmatha, Bogura');
  });

  it('counts as failed when nobody has an address', async () => {
    jest.spyOn(addressApi, 'getGeoAddress').mockResolvedValue('-');
    jest.spyOn(addressApi, 'getGoogleAddress').mockRejectedValue(new Error('denied'));
    const store = makeStore();
    await store.dispatch(fetchAddress(point));
    expect(selectAddressStatus(point.latitude, point.longitude)(store.getState())).toBe('failed');
  });
});
