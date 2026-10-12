// The Engine report helpers: the status choices, the time text, the parsed answer and the CSV text.
import { ENGINE_STATUS_OPTIONS, buildEngineCsv, engineTime, parseEngineReport } from '../src/utils/engineReport';

const answer = {
  status: 1,
  events: 90,
  generated_at: '12 Oct 2026 20:38',
  totals: { on: '04:21:55', off: '324:02:53', idle: '01:46:40' },
  items: [
    { vehicle: 'Bogura LA 15-4717 (LA 15)', status: 'Off', from: '12 Oct 2026 00:00:00', to: '12 Oct 2026 00:19:51', duration: '00:19:51' },
    { vehicle: 'Bogura LA 15-4717 (LA 15)', status: 'On', from: '12 Oct 2026 14:47:38', to: '12 Oct 2026 14:49:47', duration: '00:02:09' },
  ],
  pagination: { current_page: 1, last_page: 4, total: 90 },
};

describe('ENGINE_STATUS_OPTIONS', () => {
  it('has the four choices of the web page', () => {
    expect(ENGINE_STATUS_OPTIONS.map((option) => option.value)).toEqual(['all', 'on', 'off', 'idle']);
    expect(ENGINE_STATUS_OPTIONS[0].label).toBe('All Status');
  });
});

describe('engineTime', () => {
  it('writes the web 12 hour format', () => {
    expect(engineTime('12 Oct 2026 00:00:00')).toBe('12 Oct 2026, 12:00:00 AM');
    expect(engineTime('12 Oct 2026 14:49:47')).toBe('12 Oct 2026, 02:49:47 PM');
  });

  it('keeps text it cannot read', () => {
    expect(engineTime('-')).toBe('-');
  });
});

describe('parseEngineReport', () => {
  const data = parseEngineReport(answer);

  it('keeps the four total boxes', () => {
    expect(data.engineOn).toBe('04:21:55');
    expect(data.engineOff).toBe('324:02:53');
    expect(data.idle).toBe('01:46:40');
    expect(data.events).toBe(90);
    expect(data.generatedAt).toBe('12 Oct 2026 20:38');
  });

  it('turns the sessions into rows', () => {
    expect(data.rows[0]).toMatchObject({
      vehicle: 'Bogura LA 15-4717 (LA 15)',
      status: 'Off',
      from: '12 Oct 2026, 12:00:00 AM',
      to: '12 Oct 2026, 12:19:51 AM',
      duration: '00:19:51',
    });
    expect(data.total).toBe(90);
    expect(data.lastPage).toBe(4);
  });

  it('copes with an empty answer', () => {
    const empty = parseEngineReport({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.engineOn).toBe('00:00:00');
    expect(empty.events).toBe(0);
  });
});

describe('buildEngineCsv', () => {
  it('writes a header and one line per session', () => {
    const lines = buildEngineCsv(parseEngineReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Vehicle,Status,From,To,Duration');
    expect(lines[2]).toBe('1,"Bogura LA 15-4717 (LA 15)",Off,"12 Oct 2026, 12:00:00 AM","12 Oct 2026, 12:19:51 AM",00:19:51');
  });
});
