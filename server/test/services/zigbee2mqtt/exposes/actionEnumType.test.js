const { assert } = require('chai');

const enumType = require('../../../../services/zigbee2mqtt/exposes/enumType');
const { BUTTON_STATUS } = require('../../../../utils/constants');

describe('zigbee2mqtt action enumType', () => {
  const expose = {
    name: 'action',
    values: ['single', 'long', 'short', 'double', 'triple', 'hold'],
  };

  [
    { enumValue: 'single', intValue: BUTTON_STATUS.CLICK },
    { enumValue: 'double', intValue: BUTTON_STATUS.DOUBLE_CLICK },
    { enumValue: 'hold', intValue: BUTTON_STATUS.HOLD_CLICK },
    { enumValue: 'long', intValue: BUTTON_STATUS.LONG_CLICK },
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
      values: ['single', 'short', 'double', 'triple'],
    };
    const result = enumType.writeValue(missingEnumExpose, BUTTON_STATUS.LONG_CLICK);
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

  it('should have multiple indexes', () => {
    const result = enumType.getFeatureIndexes(['1_single', '1_double', '2_single']);
    assert.deepEqual(result, [1, 2]);
  });

  it('should have no indexes', () => {
    const result = enumType.getFeatureIndexes(['single', 'double']);
    assert.deepEqual(result, []);
  });
});
