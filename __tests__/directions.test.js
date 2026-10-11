// Route finder: reading Google's answer, and writing distance, time and traffic.
import {
  buildGoogleMapsUrl,
  decodePolyline,
  formatArrival,
  formatDistance,
  formatDuration,
  getTrafficInfo,
  parseDirections,
  straightLineMeters,
  stripHtml,
  toDirectionsPlace,
} from '../src/utils/directions';

describe('decodePolyline', () => {
  it('decodes the example line from the Google documentation', () => {
    const points = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
    expect(points).toHaveLength(3);
    expect(points[0]).toEqual({ latitude: 38.5, longitude: -120.2 });
    expect(points[1]).toEqual({ latitude: 40.7, longitude: -120.95 });
    expect(points[2]).toEqual({ latitude: 43.252, longitude: -126.453 });
  });

  it('gives an empty list for an empty line', () => {
    expect(decodePolyline('')).toEqual([]);
  });
});

describe('text helpers', () => {
  it('writes distances', () => {
    expect(formatDistance(850)).toBe('850 m');
    expect(formatDistance(12345)).toBe('12.3 km');
    expect(formatDistance(185015)).toBe('185 km');
  });

  it('writes durations', () => {
    expect(formatDuration(14834)).toBe('4 h 7 min');
    expect(formatDuration(2700)).toBe('45 min');
    expect(formatDuration(7200)).toBe('2 h');
    expect(formatDuration(20)).toBe('1 min');
  });

  it('strips the html in a step', () => {
    expect(stripHtml('Turn <b>left</b> onto <b>N5</b><div style="font-size:0.9em">Toll road</div>')).toBe(
      'Turn left onto N5 Toll road',
    );
  });

  it('writes the arrival time in Bangladesh time', () => {
    // 06:00 UTC = 12:00 in Bangladesh; 1 hour later = 01:00 PM
    expect(formatArrival(3600, Date.UTC(2026, 9, 11, 6, 0, 0))).toBe('01:00 PM');
  });
});

describe('getTrafficInfo', () => {
  it('grades the delay', () => {
    expect(getTrafficInfo(1000, 1050).level).toBe('light');
    expect(getTrafficInfo(1000, 1200).level).toBe('moderate');
    expect(getTrafficInfo(1000, 1600)).toMatchObject({ level: 'heavy', delaySeconds: 600, text: 'Heavy traffic, +10 min' });
  });

  it('says so when Google sent no traffic time', () => {
    expect(getTrafficInfo(1000, null).level).toBe('unknown');
  });
});

describe('parseDirections', () => {
  const answer = {
    status: 'OK',
    routes: [
      {
        summary: 'N5',
        overview_polyline: { points: '_p~iF~ps|U_ulLnnqC' },
        legs: [
          {
            distance: { value: 185015 },
            duration: { value: 12000 },
            duration_in_traffic: { value: 14834 },
            start_address: 'Bogura',
            end_address: 'Dhaka',
            start_location: { lat: 24.8, lng: 89.3 },
            end_location: { lat: 23.8, lng: 90.4 },
            steps: [{ html_instructions: 'Head <b>south</b>', distance: { text: '1.2 km' }, duration: { text: '3 mins' } }],
          },
        ],
      },
      { summary: 'N6', overview_polyline: { points: '' }, legs: [{ distance: { value: 200000 }, duration: { value: 13000 } }] },
    ],
  };

  it('reads distance, time, traffic, places and steps', () => {
    const [first, second] = parseDirections(answer);
    expect(first).toMatchObject({
      summary: 'N5',
      distanceMeters: 185015,
      normalSeconds: 12000,
      trafficSeconds: 14834,
      durationSeconds: 14834,
      startAddress: 'Bogura',
      endAddress: 'Dhaka',
      end: { latitude: 23.8, longitude: 90.4 },
    });
    expect(first.traffic.level).toBe('moderate');
    expect(first.points).toHaveLength(2);
    expect(first.steps).toEqual([{ text: 'Head south', distanceText: '1.2 km', durationText: '3 mins' }]);
    expect(second.trafficSeconds).toBeNull();
    expect(second.durationSeconds).toBe(13000);
  });

  it('is empty when there is no route', () => {
    expect(parseDirections({ status: 'ZERO_RESULTS', routes: [] })).toEqual([]);
    expect(parseDirections(null)).toEqual([]);
  });
});

describe('places and links', () => {
  it('writes a place for the Directions request', () => {
    expect(toDirectionsPlace({ latitude: 23.8, longitude: 90.4 })).toBe('23.8,90.4');
    expect(toDirectionsPlace({ latitude: 0, longitude: 0, placeId: 'ChIJabc' })).toBe('place_id:ChIJabc');
  });

  it('measures the straight line', () => {
    // Bogura to Dhaka is about 185 km by road and a bit over 150 km in a straight line
    const meters = straightLineMeters({ latitude: 24.8465, longitude: 89.3773 }, { latitude: 23.8103, longitude: 90.4125 });
    expect(meters / 1000).toBeGreaterThan(150);
    expect(meters / 1000).toBeLessThan(165);
  });

  it('builds the Google Maps link', () => {
    const url = buildGoogleMapsUrl({ latitude: 24.8, longitude: 89.3 }, { latitude: 23.8, longitude: 90.4, placeId: 'ChIJabc', label: 'Dhaka' });
    expect(url).toContain('origin=24.8%2C89.3');
    expect(url).toContain('destination=Dhaka');
    expect(url).toContain('destination_place_id=ChIJabc');
    expect(url).toContain('travelmode=driving');
  });
});
