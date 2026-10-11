// The distance texts shown on a vehicle row.
import { getTravelSummary } from '../src/utils/vehicleTravel';

describe('getTravelSummary', () => {
  it('is unknown until the vehicle details are loaded', () => {
    expect(getTravelSummary({ id: 1 })).toEqual({ today: null, total: null });
    expect(getTravelSummary(undefined)).toEqual({ today: null, total: null });
  });

  it('reads today and total from the details', () => {
    const vehicle = { details: { today_travel: '107.16', total_distance: 449.06 } };
    expect(getTravelSummary(vehicle)).toEqual({ today: '107.2 km', total: '449.1 km' });
  });

  it('writes big totals without decimals and with a thousands comma', () => {
    expect(getTravelSummary({ details: { today_travel: 0, total_distance: 12345.6 } })).toEqual({
      today: '0.0 km',
      total: '12,346 km',
    });
  });

  it('prefers values on the list item itself, if the server sends them', () => {
    const vehicle = { today_travel: 5, total_distance: 20, details: { today_travel: 99, total_distance: 999 } };
    expect(getTravelSummary(vehicle)).toEqual({ today: '5.0 km', total: '20.0 km' });
  });
});
