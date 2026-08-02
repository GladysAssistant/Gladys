const { expect } = require('chai');
const {
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
} = require('../../utils/constants');

describe('constants THERMOSTAT_MODE', () => {
  it('should expose the expected mode values', () => {
    expect(THERMOSTAT_MODE).to.deep.equal({
      OFF: 0,
      HEATING: 1,
      COOLING: 2,
      AUTO: 3,
    });
  });
});

describe('constants THERMOSTAT_OPERATING_STATE', () => {
  it('should expose the expected operating state values', () => {
    expect(THERMOSTAT_OPERATING_STATE).to.deep.equal({
      IDLE: 0,
      HEATING: 1,
      COOLING: 2,
    });
  });
});

describe('constants DEVICE_FEATURE_CATEGORIES.THERMOSTAT / DEVICE_FEATURE_TYPES.THERMOSTAT', () => {
  it('should expose the thermostat category', () => {
    expect(DEVICE_FEATURE_CATEGORIES.THERMOSTAT).to.equal('thermostat');
  });

  it('should expose the mode, the temperature and operating-state feature types', () => {
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE).to.equal('target-temperature');
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.MODE).to.equal('mode');
    expect(DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE).to.equal('operating-state');
  });
});
