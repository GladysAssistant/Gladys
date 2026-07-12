const { assert } = require('chai');

const numericType = require('../../../../services/zigbee2mqtt/exposes/numericType');
const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');

describe('zigbee2mqtt numericType', () => {
  it('should write value', () => {
    const expose = {};
    const result = numericType.writeValue(expose, 17);
    assert.equal(result, 17);
  });

  it('should read value', () => {
    const expose = {};
    const result = numericType.readValue(expose, 17);
    assert.equal(result, 17);
  });

  it('should read linkquality value', () => {
    const expose = { name: 'linkquality' };
    const result = numericType.readValue(expose, 102);
    assert.equal(result, 2);
  });

  describe('SONOFF SWV water valve features', () => {
    it('should configure flow feature', () => {
      assert.deepEqual(numericType.names.flow.feature, {
        category: DEVICE_FEATURE_CATEGORIES.WATER_VALVE,
        type: DEVICE_FEATURE_TYPES.WATER_VALVE.FLOW,
        unit: DEVICE_FEATURE_UNITS.CUBIC_METER_PER_HOUR,
        min: 0,
        max: 100,
      });
    });

    it('should configure real_time_irrigation_duration feature', () => {
      assert.deepEqual(numericType.names.real_time_irrigation_duration.feature, {
        category: DEVICE_FEATURE_CATEGORIES.WATER_VALVE,
        type: DEVICE_FEATURE_TYPES.WATER_VALVE.REAL_TIME_IRRIGATION_DURATION,
        unit: DEVICE_FEATURE_UNITS.SECONDS,
        min: 0,
        max: 86400,
      });
    });

    it('should configure real_time_irrigation_volume feature', () => {
      assert.deepEqual(numericType.names.real_time_irrigation_volume.feature, {
        category: DEVICE_FEATURE_CATEGORIES.WATER_VALVE,
        type: DEVICE_FEATURE_TYPES.WATER_VALVE.REAL_TIME_IRRIGATION_VOLUME,
        unit: DEVICE_FEATURE_UNITS.LITER,
        min: 0,
        max: 1000000,
      });
    });

    it('should configure daily_irrigation_volume feature', () => {
      assert.deepEqual(numericType.names.daily_irrigation_volume.feature, {
        category: DEVICE_FEATURE_CATEGORIES.WATER_VALVE,
        type: DEVICE_FEATURE_TYPES.WATER_VALVE.DAILY_IRRIGATION_VOLUME,
        unit: DEVICE_FEATURE_UNITS.LITER,
        min: 0,
        max: 1000000,
      });
    });
  });
});
