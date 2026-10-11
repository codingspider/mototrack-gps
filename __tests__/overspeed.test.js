import overspeedReducer, { fetchOverspeedLimit, limitFromResponse, selectOverspeed } from '../src/store/slices/overspeedSlice';

// The slice only needs the API functions to exist; the network (axios) is not part of this test
jest.mock('../src/api/overspeedApi', () => ({
  getOverspeedLimit: jest.fn(),
  setOverspeedLimit: jest.fn(),
  removeOverspeedLimit: jest.fn(),
}));

describe('limitFromResponse', () => {
  it('is null when the vehicle has no limit of its own', () => {
    // real answer of the server for a vehicle with no limit
    const data = { status: 1, overspeed: null, other_overspeed_alerts: [{ alert_id: 137, limit: 80, active: true }] };
    expect(limitFromResponse(data)).toBeNull();
  });
  it('reads a limit when the server sends one, and ignores nonsense', () => {
    expect(limitFromResponse({ overspeed: { limit: 90 } })).toBe(90);
    expect(limitFromResponse({ overspeed: { limit: '0' } })).toBeNull();
    expect(limitFromResponse({ overspeed: {} })).toBeNull();
    expect(limitFromResponse(undefined)).toBeNull();
  });
});

describe('overspeedSlice', () => {
  const run = (state, type, meta, payload) => overspeedReducer(state, { type, meta: { arg: meta }, payload });

  it('keeps one entry per vehicle', () => {
    let state = overspeedReducer(undefined, { type: 'init' });
    state = run(state, fetchOverspeedLimit.pending.type, { deviceId: 8 });
    expect(selectOverspeed(8)({ overspeed: state }).status).toBe('loading');
    state = run(state, fetchOverspeedLimit.fulfilled.type, { deviceId: 8 }, { deviceId: 8, limit: 80 });
    expect(selectOverspeed(8)({ overspeed: state })).toMatchObject({ limit: 80, status: 'succeeded' });
    expect(selectOverspeed(6)({ overspeed: state }).limit).toBeNull();
  });
});
