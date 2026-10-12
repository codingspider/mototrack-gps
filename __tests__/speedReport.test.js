// The Speed report helpers: the parsed answer, the chart helpers and the CSV text.
import { buildSegments, buildSpeedCsv, chartDatasets, niceMax, parseSpeedReport, tickIndexes } from '../src/utils/speedReport';

const answer = {
  status: 1,
  date: '2026-10-12',
  to_date: '2026-10-12',
  bucket_label: '1 minute',
  generated_at: '12 Oct 2026 20:38',
  selected_device: null,
  chart: { labels: ['00:19', '00:20'], datasets: [{ label: 'Bogura LA 15-4717', data: [0, 27] }] },
  items: [
    { vehicle: 'Bogura LA 15-4717', date: '2026-10-12', start_time: '00:19:51', end_time: '00:19:51', latitude: 24.853413, longitude: 89.349271, max_speed: 0, avg_speed: 0, min_speed: 0 },
    { vehicle: 'Old', date: '2026-10-12', time: '00:20', latitude: null, longitude: null, max_speed: 27, avg_speed: 24.5, min_speed: 22 },
  ],
  speed_summary: { max_speed: 62, min_speed: 0, avg_speed: 23.21 },
  pagination: { current_page: 1, last_page: 13, total: 318 },
};

describe('parseSpeedReport', () => {
  const data = parseSpeedReport(answer);

  it('keeps the three speeds and the scope text', () => {
    expect(data.maxSpeed).toBe(62);
    expect(data.minSpeed).toBe(0);
    expect(data.avgSpeed).toBe(23.21);
    expect(data.hasData).toBe(true);
    expect(data.scope).toBe('All vehicles · 2026-10-12');
    expect(data.bucketLabel).toBe('1 minute');
  });

  it('names the vehicle and the range in the scope', () => {
    const one = parseSpeedReport({ ...answer, selected_device: { id: 5, name: 'Bogura NA 11-1516' }, to_date: '2026-10-14' });
    expect(one.scope).toBe('Bogura NA 11-1516 · 2026-10-12 – 2026-10-14');
  });

  it('turns the rows, also from an older answer', () => {
    expect(data.rows[0]).toMatchObject({ vehicle: 'Bogura LA 15-4717', start: '00:19:51', max: 0, latitude: 24.853413 });
    expect(data.rows[1]).toMatchObject({ start: '00:20', end: '00:20', latitude: null, avg: 24.5 });
    expect(data.total).toBe(318);
    expect(data.lastPage).toBe(13);
  });

  it('fills the vehicle and date of rows from an older server answer', () => {
    const old = parseSpeedReport({
      status: 1,
      date: '2026-10-12',
      selected_device: { id: 5, name: 'Bogura LA 15-4717' },
      items: [{ time: '00:19', max_speed: 12, avg_speed: 8, min_speed: 3 }],
    });
    expect(old.rows[0]).toMatchObject({ vehicle: 'Bogura LA 15-4717', date: '2026-10-12', start: '00:19', max: 12 });
  });

  it('copes with an empty answer', () => {
    const empty = parseSpeedReport({ status: 1, speed_summary: null });
    expect(empty.hasData).toBe(false);
    expect(empty.rows).toEqual([]);
    expect(empty.chart.datasets).toEqual([]);
  });
});

describe('chart helpers', () => {
  it('uses the datasets of a newer answer', () => {
    const datasets = [{ label: 'A', data: [1, 2] }];
    expect(chartDatasets({ labels: ['00:00', '00:01'], datasets })).toBe(datasets);
  });

  it('makes max, avg and min lines from an older answer', () => {
    const sets = chartDatasets({ labels: ['00:00', '00:01'], max: [10, 20], avg: [5, 8], min: [0, 1] });
    expect(sets.map((set) => set.label)).toEqual(['Maximum', 'Average', 'Minimum']);
    expect(sets[0].data).toEqual([10, 20]);
  });

  it('gives no lines when there is no data', () => {
    expect(chartDatasets({ labels: [], max: [], avg: [], min: [] })).toEqual([]);
    expect(chartDatasets(undefined)).toEqual([]);
  });

  it('rounds the top of the speed axis up', () => {
    expect(niceMax(62)).toBe(70);
    expect(niceMax(70)).toBe(70);
    expect(niceMax(0)).toBe(10);
  });

  it('breaks a line where there is no reading', () => {
    const segments = buildSegments([5, 7, null, null, 9, 3]);
    expect(segments).toEqual([
      [{ index: 0, value: 5 }, { index: 1, value: 7 }],
      [{ index: 4, value: 9 }, { index: 5, value: 3 }],
    ]);
    expect(buildSegments([null, null])).toEqual([]);
  });

  it('picks evenly spaced labels, first and last included', () => {
    expect(tickIndexes(3)).toEqual([0, 1, 2]);
    expect(tickIndexes(101, 5)).toEqual([0, 25, 50, 75, 100]);
    expect(tickIndexes(0)).toEqual([]);
  });
});

describe('buildSpeedCsv', () => {
  it('writes a header and one line per row', () => {
    const lines = buildSpeedCsv(parseSpeedReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Vehicle,Date,Time (Start),Time (End),Latitude,Longitude,Max Speed (km/h),Avg Speed (km/h),Min Speed (km/h)');
    expect(lines[2]).toBe('1,"Bogura LA 15-4717",2026-10-12,00:19:51,00:19:51,24.853413,89.349271,0.00,0.00,0.00');
    expect(lines[3]).toBe('2,"Old",2026-10-12,00:20,00:20,,,27.00,24.50,22.00');
  });
});
