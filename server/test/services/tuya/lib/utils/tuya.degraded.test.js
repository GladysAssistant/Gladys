const { expect } = require('chai');
const {
  LOCAL_FAILURE_THRESHOLD,
  LOCAL_FAILURE_WINDOW_MS,
  DEGRADED_DURATION_MS,
  isDegradingError,
  recordLocalFailure,
  recordLocalSuccess,
  resetLocalStatus,
  getLocalStatus,
  isLocalSkipNeeded,
  getAllDegraded,
} = require('../../../../../services/tuya/lib/utils/tuya.degraded');

describe('tuya.degraded.isDegradingError', () => {
  it('returns false on null/undefined', () => {
    expect(isDegradingError(null)).to.equal(false);
    expect(isDegradingError(undefined)).to.equal(false);
  });

  it('returns true on degrading error code', () => {
    expect(isDegradingError({ code: 'ECONNRESET' })).to.equal(true);
    expect(isDegradingError({ code: 'ETIMEDOUT' })).to.equal(true);
    expect(isDegradingError({ code: 'EHOSTUNREACH' })).to.equal(true);
  });

  it('returns true when message contains a degrading code string', () => {
    expect(isDegradingError({ message: 'connect ECONNRESET 1.2.3.4:6668' })).to.equal(true);
    expect(isDegradingError({ message: 'Error: EHOSTUNREACH' })).to.equal(true);
  });

  it('returns false on non-degrading errors', () => {
    expect(isDegradingError({ code: 'EACCES' })).to.equal(false);
    expect(isDegradingError({ message: 'some random error' })).to.equal(false);
    expect(isDegradingError({})).to.equal(false);
  });
});

describe('tuya.degraded.recordLocalFailure', () => {
  it('returns null and does nothing on bad input', () => {
    expect(recordLocalFailure(null, 'd1', { code: 'ECONNRESET' })).to.equal(null);
    expect(recordLocalFailure({}, null, { code: 'ECONNRESET' })).to.equal(null);
  });

  it('returns null for non-degrading errors', () => {
    const map = {};
    expect(recordLocalFailure(map, 'd1', { code: 'EACCES' })).to.equal(null);
    expect(map).to.deep.equal({});
  });

  it('accumulates failure timestamps without flipping to degraded under threshold', () => {
    const map = {};
    const now = 1000;
    recordLocalFailure(map, 'd1', { code: 'ECONNRESET' }, now);
    recordLocalFailure(map, 'd1', { code: 'ECONNRESET' }, now + 1000);
    expect(map.d1.status).to.equal('ok');
    expect(map.d1.failureTimestamps).to.have.length(2);
  });

  it('flips to degraded once threshold is reached within the window', () => {
    const map = {};
    const now = 1000;
    for (let i = 0; i < LOCAL_FAILURE_THRESHOLD; i += 1) {
      recordLocalFailure(map, 'd1', { code: 'ECONNRESET' }, now + i * 1000);
    }
    expect(map.d1.status).to.equal('degraded');
    expect(map.d1.until).to.equal(now + (LOCAL_FAILURE_THRESHOLD - 1) * 1000 + DEGRADED_DURATION_MS);
    expect(map.d1.failureTimestamps).to.deep.equal([]);
  });

  it('drops failure timestamps that fall outside the window', () => {
    const map = {};
    const baseNow = 1000;
    recordLocalFailure(map, 'd1', { code: 'ECONNRESET' }, baseNow);
    recordLocalFailure(map, 'd1', { code: 'ECONNRESET' }, baseNow + LOCAL_FAILURE_WINDOW_MS + 1);
    expect(map.d1.status).to.equal('ok');
    expect(map.d1.failureTimestamps).to.have.length(1);
  });
});

describe('tuya.degraded.recordLocalSuccess / resetLocalStatus', () => {
  it('clears the entry on success', () => {
    const map = { d1: { failureTimestamps: [1, 2], until: 999, status: 'degraded' } };
    recordLocalSuccess(map, 'd1');
    expect(map.d1).to.equal(undefined);
  });

  it('is a no-op on bad input', () => {
    expect(() => recordLocalSuccess(null, 'd1')).to.not.throw();
    expect(() => recordLocalSuccess({}, null)).to.not.throw();
  });

  it('resetLocalStatus behaves identically to recordLocalSuccess', () => {
    const map = { d1: { until: 999, status: 'degraded' } };
    resetLocalStatus(map, 'd1');
    expect(map.d1).to.equal(undefined);
  });

  it('resetLocalStatus is a no-op on bad input', () => {
    expect(() => resetLocalStatus(null, 'd1')).to.not.throw();
    expect(() => resetLocalStatus({}, null)).to.not.throw();
    expect(() => resetLocalStatus({}, '')).to.not.throw();
  });
});

describe('tuya.degraded.getLocalStatus / isLocalSkipNeeded / getAllDegraded', () => {
  it('returns null when no entry or entry is ok', () => {
    expect(getLocalStatus({}, 'd1')).to.equal(null);
    expect(getLocalStatus({ d1: { status: 'ok', until: 0 } }, 'd1')).to.equal(null);
  });

  it('returns null and cleans up when backoff has expired', () => {
    const map = { d1: { status: 'degraded', until: 100, failureTimestamps: [] } };
    expect(getLocalStatus(map, 'd1', 200)).to.equal(null);
    expect(map.d1).to.equal(undefined);
  });

  it('returns the active status and until timestamp', () => {
    const map = { d1: { status: 'degraded', until: 5000, failureTimestamps: [] } };
    expect(getLocalStatus(map, 'd1', 1000)).to.deep.equal({ status: 'degraded', until: 5000 });
  });

  it('isLocalSkipNeeded is true only for active degraded entries', () => {
    expect(isLocalSkipNeeded({}, 'd1')).to.equal(false);
    const activeMap = { d1: { status: 'degraded', until: 5000, failureTimestamps: [] } };
    expect(isLocalSkipNeeded(activeMap, 'd1', 1000)).to.equal(true);
    expect(isLocalSkipNeeded(activeMap, 'd1', 6000)).to.equal(false);
  });

  it('getAllDegraded returns only active entries', () => {
    const map = {
      d1: { status: 'degraded', until: 5000, failureTimestamps: [] },
      d2: { status: 'degraded', until: 200, failureTimestamps: [] },
      d3: { status: 'ok', until: 0, failureTimestamps: [] },
    };
    const result = getAllDegraded(map, 1000);
    expect(result).to.deep.equal({ d1: { status: 'degraded', until: 5000 } });
    expect(map.d2).to.equal(undefined);
  });

  it('returns empty object when map is null', () => {
    expect(getAllDegraded(null)).to.deep.equal({});
  });
});
