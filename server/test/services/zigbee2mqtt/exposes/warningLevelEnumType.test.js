const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { SIREN_LMH_VOLUME } = require('../../../../utils/constants');

describe('zigbee2mqtt warning level enumType', () => {
  const expose = {
    name: 'level',
    values: ['low', 'medium', 'high', 'very_high'],
  };

  [
    { enumValue: 'low', intValue: SIREN_LMH_VOLUME.LOW },
    { enumValue: 'medium', intValue: SIREN_LMH_VOLUME.MEDIUM },
    { enumValue: 'high', intValue: SIREN_LMH_VOLUME.HIGH },
    { enumValue: 'very_high', intValue: SIREN_LMH_VOLUME.VERY_HIGH },
  ].forEach((mapping) => {
    const { enumValue, intValue } = mapping;

    it(`should write ${enumValue} value as ${intValue} value`, () => {
      const result = enumType.writeValue(expose, intValue);
      assert.equal(result, enumValue);
    });

    it(`should read ${intValue} value as ${enumValue}`, () => {
      const result = enumType.readValue(expose, enumValue);
      assert.equal(result, intValue);
    });
  });
});

describe('zigbee2mqtt warning strobe_level enumType', () => {
  const expose = {
    name: 'strobe_level',
    values: ['low', 'medium', 'high', 'very_high'],
  };

  [
    { enumValue: 'low', intValue: SIREN_LMH_VOLUME.LOW },
    { enumValue: 'medium', intValue: SIREN_LMH_VOLUME.MEDIUM },
    { enumValue: 'high', intValue: SIREN_LMH_VOLUME.HIGH },
    { enumValue: 'very_high', intValue: SIREN_LMH_VOLUME.VERY_HIGH },
  ].forEach((mapping) => {
    const { enumValue, intValue } = mapping;

    it(`should write ${enumValue} value as ${intValue} value`, () => {
      const result = enumType.writeValue(expose, intValue);
      assert.equal(result, enumValue);
    });

    it(`should read ${intValue} value as ${enumValue}`, () => {
      const result = enumType.readValue(expose, enumValue);
      assert.equal(result, intValue);
    });
  });
});
