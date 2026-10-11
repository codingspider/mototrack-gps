import { buildVehicleSections } from '../src/utils/vehicleSections';

const baseVehicle = {
  id: 8,
  device_name: 'Bogura NA 11-1516',
  plate_number: '',
  status: 'Moving',
  engine_status: true,
  engine_blocked: false,
  live_speed: '42.6',
  lat: '25.098876',
  lng: '89.439795',
  address: 'Gobindaganj',
  last_position_stamp: 1791350288,
  geofences: [],
};

const findRow = (sections, label) => sections.flatMap((section) => section.rows).find((item) => item.label === label);

describe('buildVehicleSections', () => {
  it('shows live values from the vehicle', () => {
    const sections = buildVehicleSections(baseVehicle);
    expect(findRow(sections, 'Status').value).toBe('Moving');
    expect(findRow(sections, 'Speed').value).toBe('43 km/h');
    expect(findRow(sections, 'Engine').value).toBe('On');
    expect(findRow(sections, 'Coordinates').value).toBe('25.098876, 89.439795');
  });

  it('hides rows that have no value, but keeps the main ones', () => {
    const sections = buildVehicleSections(baseVehicle);
    expect(findRow(sections, 'Plate number')).toBeUndefined();
    expect(findRow(sections, 'Address').value).toBe('Gobindaganj');
  });

  it('adds the details data once loaded', () => {
    const vehicle = {
      ...baseVehicle,
      details: { today_travel: 107.16, today_travel_unit: 'Km', total_distance: 449.06 },
    };
    const sections = buildVehicleSections(vehicle);
    expect(findRow(sections, 'Today').value).toBe('107.16 Km');
    expect(findRow(sections, 'Total').value).toBe('449.06 Km');
  });

  it('puts the service expiry and warranty in the Service section', () => {
    const vehicle = {
      ...baseVehicle,
      details: { expiration_date: '2099-11-22 20:14:58' },
      warranty: { expired: false, warranty_end: '2027-09-26' },
    };
    const sections = buildVehicleSections(vehicle);
    expect(sections.find((section) => section.key === 'service')).toBeDefined();
    expect(findRow(sections, 'Service expires').value).toBe('22 Nov 2099');
    expect(findRow(sections, 'Device warranty').value).toBe('Valid until 26 Sep 2027');
  });

  it('says when there is no expiry date or warranty', () => {
    const sections = buildVehicleSections(baseVehicle);
    expect(findRow(sections, 'Service expires').value).toBe('-');
    expect(sections.find((section) => section.key === 'service').rows.map((item) => item.value)).toContain(
      'No expiry date set',
    );
    expect(findRow(sections, 'Device warranty')).toBeUndefined();
  });

  it('never shows the IMEI or sensors', () => {
    const vehicle = {
      ...baseVehicle,
      details: {
        imei: '866330055091593',
        expiration_date: '2026-11-22 20:14:58',
        sensors: [{ name: 'Ignition', value: 'Off' }],
      },
    };
    const sections = buildVehicleSections(vehicle);
    expect(findRow(sections, 'IMEI')).toBeUndefined();
    expect(findRow(sections, 'Ignition')).toBeUndefined();
    expect(sections.map((section) => section.key)).not.toContain('sensors');
  });
});
