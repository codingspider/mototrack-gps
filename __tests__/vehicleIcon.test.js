import { getVehicleIconSize, getVehicleIconUrl, shouldRotateIcon } from '../src/utils/vehicleIcon';

describe('getVehicleIconUrl', () => {
  it('uses the list value, then the details value', () => {
    expect(getVehicleIconUrl({ icon_url: 'a.png', details: { icon_url: 'b.png' } })).toBe('a.png');
    expect(getVehicleIconUrl({ details: { icon_url: 'b.png' } })).toBe('b.png');
  });
  it('returns null when there is no picture', () => {
    expect(getVehicleIconUrl({})).toBeNull();
    expect(getVehicleIconUrl(undefined)).toBeNull();
  });
});

describe('shouldRotateIcon', () => {
  it('turns rotating and arrow pictures only', () => {
    expect(shouldRotateIcon({ icon_type: 'rotating' })).toBe(true);
    expect(shouldRotateIcon({ icon_type: 'arrow' })).toBe(true);
    expect(shouldRotateIcon({ icon_type: 'icon' })).toBe(false);
    expect(shouldRotateIcon({})).toBe(false);
  });
});

describe('getVehicleIconSize', () => {
  it('keeps the picture shape', () => {
    expect(getVehicleIconSize({ icon_width: 26, icon_height: 52 }, 30)).toEqual({ width: 15, height: 30 });
  });
  it('is square when the shape is unknown', () => {
    expect(getVehicleIconSize({}, 30)).toEqual({ width: 30, height: 30 });
  });
});
