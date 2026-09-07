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

  describe('ZLinky_TIC apparent power features', () => {
    const apparentPower = (name, type) => ({
      name,
      category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
      type,
      unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
    });

    it('should map SINSTS to the single or three-phase total, without phase suffix', () => {
      assert.deepEqual(
        numericType.names.SINSTS.feature,
        apparentPower('Puissance apparente instantanée soutirée', DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS),
      );
    });

    it('should map SINSTS1 to the phase 1 of a three-phase meter', () => {
      assert.deepEqual(
        numericType.names.SINSTS1.feature,
        apparentPower('Puissance apparente instantanée soutirée Phase 1', DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS1),
      );
      assert.deepEqual(
        numericType.names.SINSTS2.feature,
        apparentPower('Puissance apparente instantanée soutirée Phase 2', DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2),
      );
      assert.deepEqual(
        numericType.names.SINSTS3.feature,
        apparentPower('Puissance apparente instantanée soutirée Phase 3', DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3),
      );
    });

    it('should map SMAXN and SMAXN-1 without phase suffix', () => {
      assert.deepEqual(
        numericType.names.SMAXN.feature,
        apparentPower('Puissance apparente maximale soutirée n', DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN),
      );
      assert.deepEqual(
        numericType.names['SMAXN-1'].feature,
        apparentPower('Puissance apparente maximale soutirée n-1', DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1),
      );
    });

    it('should map SMAXN1 and SMAXN1-1 to the phase 1 of a three-phase meter', () => {
      assert.deepEqual(
        numericType.names.SMAXN1.feature,
        apparentPower('Puissance apparente maximale soutirée n Phase 1', DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN1),
      );
      assert.deepEqual(
        numericType.names['SMAXN1-1'].feature,
        apparentPower(
          'Puissance apparente maximale soutirée n-1 Phase 1',
          DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN1_1,
        ),
      );
    });

    it('should map the SMAXSN labels of recent Zigbee2mqtt versions to the SMAXN features', () => {
      const aliases = {
        SMAXSN: 'SMAXN',
        SMAXSN1: 'SMAXN1',
        SMAXSN2: 'SMAXN2',
        SMAXSN3: 'SMAXN3',
        'SMAXSN-1': 'SMAXN-1',
        'SMAXSN1-1': 'SMAXN1-1',
        'SMAXSN2-1': 'SMAXN2-1',
        'SMAXSN3-1': 'SMAXN3-1',
      };
      Object.entries(aliases).forEach(([alias, label]) => {
        assert.deepEqual(numericType.names[alias], numericType.names[label], `${alias} should map to ${label}`);
      });
    });
  });

  describe('ZLinky_TIC historic mode current features', () => {
    it('should map IMAX to the single-phase max current, without phase suffix', () => {
      assert.deepEqual(numericType.names.IMAX.feature, {
        name: 'Intensité maximale',
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      });
    });

    it('should map IMAX1 to the phase 1 of a three-phase meter', () => {
      assert.deepEqual(numericType.names.IMAX1.feature, {
        name: 'Intensité maximale Phase 1',
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX1,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      });
    });

    it('should map IINST to the single-phase current, without phase suffix', () => {
      assert.deepEqual(numericType.names.IINST.feature, {
        name: 'Intensité instantanée',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      });
    });

    it('should map IINST1 to the phase 1 of a three-phase meter', () => {
      assert.deepEqual(numericType.names.IINST1.feature, {
        name: 'Intensité instantanée Phase 1',
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      });
    });
  });

  describe('Siren features', () => {
    it('should configure max_duration feature', () => {
      assert.deepEqual(numericType.names.max_duration.feature, {
        category: DEVICE_FEATURE_CATEGORIES.DURATION,
        type: DEVICE_FEATURE_TYPES.DURATION.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.SECONDS,
      });
    });
  });
});
