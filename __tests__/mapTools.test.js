import { buildGeofencePayload, MIN_GEOFENCE_POINTS } from '../src/utils/geofence';
import {
  getStreetViewAppUrl,
  getStreetViewHtml,
  getStreetViewMetadataUrl,
  normalizeHeading,
} from '../src/utils/streetView';

describe('buildGeofencePayload', () => {
  it('turns the drawn corners into the server body', () => {
    const points = [
      { latitude: 24.8, longitude: 89.3 },
      { latitude: 24.9, longitude: 89.4 },
      { latitude: 24.7, longitude: 89.5 },
    ];
    expect(buildGeofencePayload('  Office  ', points, '#ee193d')).toEqual({
      name: 'Office',
      type: 'polygon',
      polygon_color: '#ee193d',
      polygon: [
        { lat: 24.8, lng: 89.3 },
        { lat: 24.9, lng: 89.4 },
        { lat: 24.7, lng: 89.5 },
      ],
    });
  });
  it('needs at least 3 points to make an area', () => {
    expect(MIN_GEOFENCE_POINTS).toBe(3);
  });
});

describe('street view links', () => {
  it('keeps the heading between 0 and 359', () => {
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-45)).toBe(315);
    expect(normalizeHeading(0)).toBe(0);
  });
  it('asks for the nearest picture within 300 meters', () => {
    const url = getStreetViewMetadataUrl(25.1, 89.4, 'KEY');
    expect(url).toContain('location=25.1,89.4');
    expect(url).toContain('radius=300');
    expect(url).toContain('key=KEY');
  });
  it('builds the interactive page for a panorama', () => {
    const html = getStreetViewHtml('abc 123', 450, 'KEY');
    expect(html).toContain('pano=abc%20123');
    expect(html).toContain('heading=90');
    expect(html).toContain('key=KEY');
  });
  it('builds the Google Maps link', () => {
    expect(getStreetViewAppUrl(25.1, 89.4, 400)).toContain('viewpoint=25.1,89.4&heading=40');
  });
});
