const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { SIREN_MODE } = require('../../../../utils/constants');

describe('zigbee2mqtt warning mode enumType', () => {
  const expose = {
    name: 'mode',
    values: ['stop', 'burglar', 'fire', 'emergency', 'police_panic', 'fire_panic', 'emergency_panic'],
  };

  [
    { enumValue: 'stop', intValue: SIREN_MODE.STOP },
    { enumValue: 'burglar', intValue: SIREN_MODE.BURGLAR },
    { enumValue: 'fire', intValue: SIREN_MODE.FIRE },
    { enumValue: 'emergency', intValue: SIREN_MODE.EMERGENCY },
    { enumValue: 'police_panic', intValue: SIREN_MODE.POLICE_PANIC },
    { enumValue: 'fire_panic', intValue: SIREN_MODE.FIRE_PANIC },
    { enumValue: 'emergency_panic', intValue: SIREN_MODE.EMERGENCY_PANIC },
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

  it('should write undefined value on unknown int', () => {
    const result = enumType.writeValue(expose, 99);
    assert.equal(result, undefined);
  });

  it('should read undefined value on unknown string', () => {
    const result = enumType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
