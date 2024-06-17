const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { SIREN_LMH_VOLUME } = require('../../../../utils/constants');

describe('zigbee2mqtt volume enumType', () => {
  const expose = {
    name: 'volume',
    values: ['low', 'medium', 'high'],
  };

  [
    { enumValue: 'low', intValue: SIREN_LMH_VOLUME.LOW },
    { enumValue: 'medium', intValue: SIREN_LMH_VOLUME.MEDIUM },
    { enumValue: 'high', intValue: SIREN_LMH_VOLUME.HIGH },
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

  it('should write undefined value on missing enum', () => {
    const missingEnumExpose = {
      values: ['low', 'medium'],
    };
    const result = enumType.writeValue(missingEnumExpose, SIREN_LMH_VOLUME.HIGH);
    assert.equal(result, undefined);
  });

  it('should write undefined value', () => {
    const result = enumType.writeValue(expose, 7);
    assert.equal(result, undefined);
  });

  it('should read enum value', () => {
    const result = enumType.readValue(expose, 'unknown');
    assert.equal(result, undefined);
  });
});
