// A server whose clock is off breaks everything that relies on the time:
// scheduled scenes run at the wrong hour, states are saved in the past or in
// the future, energy is counted on the wrong day. The device running this
// front (phone, computer) almost always has its clock synchronized over the
// network: comparing both clocks reveals a wrong server clock, without
// asking anything to a third-party service.

// Under this gap, nothing visible goes wrong, and a device whose own clock
// is slightly off must not raise the alarm.
const CLOCK_OFFSET_THRESHOLD_MS = 2 * 60 * 1000;

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

// The server time is read during the request: its exact moment is unknown,
// somewhere between the request and the response. Assuming the middle of the
// round trip, the error is at most half of it.
const measureClockOffset = async httpClient => {
  const requestedAt = Date.now();
  const { server_time: serverTime } = await httpClient.get('/api/v1/system/clock');
  const receivedAt = Date.now();
  const serverTimestamp = Date.parse(serverTime);
  if (Number.isNaN(serverTimestamp)) {
    return null;
  }
  return {
    offset: serverTimestamp - (requestedAt + receivedAt) / 2,
    uncertainty: (receivedAt - requestedAt) / 2
  };
};

// Only a gap larger than the threshold even in the most favorable reading of
// the measurement counts: a slow response must never raise a false alarm.
const isClockOffsetSignificant = measure =>
  !!measure && Math.abs(measure.offset) - measure.uncertainty > CLOCK_OFFSET_THRESHOLD_MS;

// The gap, rounded to the unit a human would use: "3 minutes", "2 hours", "5 days".
// direction: 'ahead' when the server is in the future of this device.
const describeClockOffset = offset => {
  const absolute = Math.abs(offset);
  const direction = offset > 0 ? 'ahead' : 'behind';
  if (absolute >= DAY_MS) {
    return { direction, unit: 'days', count: Math.round(absolute / DAY_MS) };
  }
  if (absolute >= HOUR_MS) {
    return { direction, unit: 'hours', count: Math.round(absolute / HOUR_MS) };
  }
  return { direction, unit: 'minutes', count: Math.max(1, Math.round(absolute / MINUTE_MS)) };
};

export { CLOCK_OFFSET_THRESHOLD_MS, measureClockOffset, isClockOffsetSignificant, describeClockOffset };
