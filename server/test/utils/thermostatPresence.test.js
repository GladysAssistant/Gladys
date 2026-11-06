const { expect } = require('chai');

const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, PILOT_WIRE_MODE } = require('../../utils/constants');
const { isPresenceSensor, presetSavingForEmptyRoom, absenceLowersHold } = require('../../utils/thermostatPresence');

describe('thermostatPresence: isPresenceSensor', () => {
  it('should take a motion or presence sensor reporting a state', () => {
    expect(
      isPresenceSensor({ category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.BINARY }),
    ).to.equal(true);
    expect(
      isPresenceSensor({
        category: DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    ).to.equal(true);
  });

  // A push only says that something happened, never that it stopped.
  it('should refuse a push, another category, and no feature', () => {
    expect(
      isPresenceSensor({ category: DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR, type: DEVICE_FEATURE_TYPES.SENSOR.PUSH }),
    ).to.equal(false);
    expect(
      isPresenceSensor({
        category: DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      }),
    ).to.equal(false);
    expect(isPresenceSensor(null)).to.equal(false);
  });
});

describe('thermostatPresence: presetSavingForEmptyRoom', () => {
  const setpoints = { frost: 7, away: 16, eco: 18, night: 17, comfort: 21 };
  const setpointOf = (preset) => setpoints[preset];

  it('should lower when heating, by default', () => {
    expect(presetSavingForEmptyRoom('comfort', 'eco', { setpointOf })).to.equal('eco');
    expect(presetSavingForEmptyRoom('night', 'eco', { setpointOf })).to.equal('night');
  });

  it('should raise when cooling', () => {
    const cooling = { comfort: 24, eco: 26 };
    expect(presetSavingForEmptyRoom('comfort', 'eco', { cooling: true, setpointOf: (p) => cooling[p] })).to.equal(
      'eco',
    );
  });

  it('should leave the absence preset itself, off and schedule alone', () => {
    expect(presetSavingForEmptyRoom('eco', 'eco', { setpointOf })).to.equal('eco');
    expect(presetSavingForEmptyRoom('off', 'eco', { setpointOf })).to.equal('off');
    expect(presetSavingForEmptyRoom('schedule', 'eco', { setpointOf })).to.equal('schedule');
    expect(presetSavingForEmptyRoom(null, 'eco', { setpointOf })).to.equal(null);
  });

  it('should weigh the orders the module takes', () => {
    const orders = { eco: PILOT_WIRE_MODE.COMFORT_1, comfort: PILOT_WIRE_MODE.COMFORT };
    const orderOf = (preset) => orders[preset];
    const fourOrders = [0, 1, 2, 5].map((value) => ({ value }));

    expect(presetSavingForEmptyRoom('comfort', 'eco', { orderOf })).to.equal('eco');
    // Comfort -1 is sent as comfort: no saving.
    expect(presetSavingForEmptyRoom('comfort', 'eco', { orderOf, supportedOptions: fourOrders })).to.equal('comfort');
    // A module that takes neither order changes nothing.
    expect(
      presetSavingForEmptyRoom('comfort', 'eco', { orderOf, supportedOptions: [{ value: PILOT_WIRE_MODE.ECO }] }),
    ).to.equal('comfort');
  });
});

describe('thermostatPresence: absenceLowersHold', () => {
  it('should lower a hold armed before the room emptied', () => {
    expect(absenceLowersHold(1000, 2000)).to.equal(true);
  });

  // A pre-heating: the room was already empty when the preset was picked.
  it('should keep a hold armed after the room emptied', () => {
    expect(absenceLowersHold(2000, 1000)).to.equal(false);
    expect(absenceLowersHold(2000, 2000)).to.equal(false);
  });

  it('should lower a hold armed at a time unknown', () => {
    expect(absenceLowersHold(null, 1000)).to.equal(true);
  });
});
