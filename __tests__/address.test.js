// addressKey groups nearby points; parseAddress reads the /geo_address answer.
import { addressKey, parseAddress } from '../src/store/slices/addressSlice';

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
